import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateBarcode(data: string, width: number = 180, height: number = 45): string {
  const pattern = data.split('').map((char) => {
    const code = char.charCodeAt(0);
    return [(code % 3) + 1, ((code >> 2) % 2) + 1];
  }).flat();
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  const totalUnits = pattern.reduce((a, b) => a + b, 0);
  const unitWidth = (width - 20) / totalUnits;
  let x = 10;
  pattern.forEach((units, i) => {
    if (i % 2 === 0) {
      svg += `<rect x="${x}" y="5" width="${units * unitWidth}" height="${height - 10}" fill="black"/>`;
    }
    x += units * unitWidth;
  });
  svg += '</svg>';
  return svg;
}

async function fetchLogoAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error("Failed to fetch logo:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub;
    const { orderId } = await req.json();

    const { data: order, error: orderError } = await supabaseService
      .from("orders").select(`*, address:addresses (*), order_items (*)`).eq("id", orderId).single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await supabaseService.rpc("is_admin", { check_user_id: userId });
    if (order.user_id !== userId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch settings in parallel
    const [settingsRes, brandingRes] = await Promise.all([
      supabaseService.from("invoice_settings").select("*").limit(1).single(),
      supabaseService.from("site_branding").select("logo_url, logo_text, contact_phone, contact_address").limit(1).single(),
    ]);

    const settings = settingsRes.data;
    const siteBranding = brandingRes.data;

    const companyName = settings?.company_name || siteBranding?.logo_text || "artistiya.store";
    const companyPhone = settings?.company_phone || siteBranding?.contact_phone || "";
    const companyAddress = settings?.company_address || siteBranding?.contact_address || "";
    const logoUrl = settings?.logo_url || siteBranding?.logo_url || null;

    let logoBase64: string | null = null;
    if (logoUrl) {
      logoBase64 = await fetchLogoAsBase64(logoUrl);
    }

    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const printDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const itemsList = order.order_items.map((item: any) => 
      `<tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12px; color: #333;">${item.product_name}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: 700; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #eee; text-align: right; font-size: 12px;">৳${item.product_price.toLocaleString()}</td>
      </tr>`
    ).join("");

    const totalItems = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const barcodeSvg = generateBarcode(order.order_number, 160, 38);

    const deliverySlipHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Delivery Slip - ${order.order_number}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: 100mm 150mm; margin: 3mm; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #1a1a1a;
      width: 100mm;
      min-height: 150mm;
      margin: 0 auto;
      padding: 8px;
      background: #fff;
    }
    
    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 3px solid #b8a88a;
      margin-bottom: 10px;
      text-align: center;
    }
    .header img { max-height: 35px; max-width: 70px; object-fit: contain; }
    .header h1 { font-size: 18px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.5px; }
    .header .tagline { font-size: 9px; color: #b8a88a; letter-spacing: 1.5px; text-transform: uppercase; }
    
    .order-box {
      background: linear-gradient(135deg, #2d2926 0%, #3d3935 100%);
      color: #fff;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .order-box .order-number { font-size: 15px; font-weight: 700; color: #b8a88a; margin-bottom: 4px; }
    .order-box .meta { display: flex; justify-content: space-between; font-size: 10px; color: #ccc; }
    .order-box .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 9px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .badge-cod { background: #ff9800; color: #fff; }
    .badge-paid { background: #4caf50; color: #fff; }
    
    .customer-section {
      border: 2px solid #2d2926;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .customer-section .label { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 5px; font-weight: 600; }
    .customer-section .name { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
    .customer-section .phone { font-size: 14px; font-weight: 700; color: #b8a88a; margin-bottom: 5px; }
    .customer-section .address { font-size: 11px; color: #555; line-height: 1.5; }
    
    .items-section { margin-bottom: 10px; }
    .items-section .label { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 5px; font-weight: 600; padding-left: 2px; }
    table { width: 100%; border-collapse: collapse; background: #fafaf8; border-radius: 6px; overflow: hidden; }
    th {
      background: linear-gradient(135deg, #2d2926, #3d3935);
      color: #b8a88a;
      padding: 7px 10px;
      text-align: left;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3) { text-align: right; }
    
    .amount-box {
      background: linear-gradient(135deg, #2d2926 0%, #3d3935 100%);
      color: #fff;
      padding: 14px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 10px;
    }
    .amount-box .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #aaa; margin-bottom: 3px; }
    .amount-box .amount { font-size: 24px; font-weight: 800; color: #b8a88a; }
    .amount-box .status { font-size: 10px; color: #4caf50; margin-top: 3px; }
    
    .barcode-section {
      text-align: center;
      padding: 8px;
      background: #f5f2ed;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .barcode-section p { font-size: 10px; font-family: 'Courier New', monospace; color: #666; margin-top: 3px; letter-spacing: 2px; }
    
    .signature-section { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
    .signature-box {
      flex: 1;
      text-align: center;
      padding: 8px;
      border: 1px dashed #ccc;
      border-radius: 6px;
    }
    .signature-box .line { border-bottom: 1px solid #999; height: 28px; margin-bottom: 4px; }
    .signature-box .label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .footer {
      text-align: center;
      padding-top: 6px;
      border-top: 1px solid #eee;
    }
    .footer p { font-size: 9px; color: #aaa; margin: 2px 0; }
    .footer .brand { font-weight: 600; color: #b8a88a; }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : ''}
    <div>
      <h1>${companyName}</h1>
      <div class="tagline">Delivery Slip</div>
    </div>
  </div>

  <div class="order-box">
    <div class="order-number">📦 #${order.order_number}</div>
    <div class="meta">
      <span>Date: ${orderDate}</span>
      <span>Items: ${totalItems} pcs</span>
    </div>
    ${order.payment_method === 'cod' 
      ? '<span class="badge badge-cod">💵 Cash on Delivery</span>' 
      : '<span class="badge badge-paid">✓ Prepaid</span>'}
  </div>

  <div class="customer-section">
    <div class="label">📍 Deliver To</div>
    <div class="name">${order.address?.full_name || 'Customer'}</div>
    <div class="phone">📞 ${order.address?.phone || 'N/A'}</div>
    <div class="address">
      ${order.address?.address_line || ''}<br>
      ${order.address?.thana || ''}, ${order.address?.district || ''}<br>
      ${order.address?.division || ''}
    </div>
  </div>

  <div class="items-section">
    <div class="label">📋 Package Contents</div>
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>${itemsList}</tbody>
    </table>
  </div>

  <div class="amount-box">
    <div class="label">${order.payment_method === 'cod' ? 'Collect Amount' : 'Order Total'}</div>
    <div class="amount">৳${order.total.toLocaleString()}</div>
    ${order.payment_method !== 'cod' ? '<div class="status">✓ Payment Completed</div>' : ''}
  </div>

  <div class="barcode-section">
    ${barcodeSvg}
    <p>${order.order_number}</p>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="line"></div>
      <div class="label">Receiver's Signature</div>
    </div>
    <div class="signature-box">
      <div class="line"></div>
      <div class="label">Authorized By</div>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with us!</p>
    <p class="brand">${companyName}</p>
    ${companyPhone ? `<p>📞 ${companyPhone}</p>` : ''}
    <p>Printed: ${printDate}</p>
  </div>
</body>
</html>`;

    return new Response(JSON.stringify({ 
      success: true, html: deliverySlipHtml, order_number: order.order_number 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating delivery slip:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate delivery slip" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
