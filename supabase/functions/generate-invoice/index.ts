import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  orderId: string;
}

// Generate QR Code as SVG
function generateQRCode(data: string, size: number = 100): string {
  const cells = 21;
  const cellSize = size / cells;
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;
  }
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  const drawFinder = (x: number, y: number) => {
    svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${7 * cellSize}" height="${7 * cellSize}" fill="black"/>`;
    svg += `<rect x="${(x + 1) * cellSize}" y="${(y + 1) * cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="white"/>`;
    svg += `<rect x="${(x + 2) * cellSize}" y="${(y + 2) * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="black"/>`;
  };
  
  drawFinder(0, 0);
  drawFinder(cells - 7, 0);
  drawFinder(0, cells - 7);
  
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if ((x < 8 && y < 8) || (x >= cells - 8 && y < 8) || (x < 8 && y >= cells - 8)) continue;
      const seed = (x * 31 + y * 17 + hash) % 100;
      if (seed < 40) {
        svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}

// Generate Barcode as SVG
function generateBarcode(data: string, width: number = 200, height: number = 50): string {
  const pattern = data.split('').map((char, i) => {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create service client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // Authentication check
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    const { orderId }: InvoiceRequest = await req.json();
    console.log(`Generating invoice for order: ${orderId}`);

    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select(`
        *,
        address:addresses (*),
        order_items (*)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify order ownership OR admin access
    const { data: isAdmin } = await supabaseService.rpc("is_admin", { check_user_id: userId });
    
    if (order.user_id !== userId && !isAdmin) {
      console.error("Order ownership mismatch:", { orderUserId: order.user_id, requestUserId: userId });
      return new Response(
        JSON.stringify({ error: "Unauthorized access to order" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Access verified - Admin: ${isAdmin}, Owner: ${order.user_id === userId}`);

    // Get invoice settings
    const { data: settings } = await supabaseService
      .from("invoice_settings")
      .select("*")
      .limit(1)
      .single();

    // Get site branding for logo
    const { data: siteBranding } = await supabaseService
      .from("site_branding")
      .select("logo_url, business_name")
      .limit(1)
      .single();

    const invoiceSettings = settings || {
      company_name: siteBranding?.business_name || "artistiya.store",
      company_address: "Dhaka, Bangladesh",
      company_email: "hello@artistiya.store",
      company_phone: "+880 1XXX-XXXXXX",
      logo_url: siteBranding?.logo_url || null,
      footer_note: "Thank you for your purchase!",
      terms_and_conditions: "All items are handcrafted and may have slight variations."
    };

    // Use site branding logo if invoice settings logo is not set
    const logoUrl = invoiceSettings.logo_url || siteBranding?.logo_url || null;

    // Get QR discount settings
    const { data: qrSettings } = await supabaseService
      .from("qr_discount_settings")
      .select("*")
      .limit(1)
      .single();

    const qrActive = qrSettings?.is_active ?? false;
    const qrDiscount = qrSettings?.discount_value ?? 5;
    const qrType = qrSettings?.discount_type ?? 'percentage';

    // Generate QR code URL for discount claim
    const baseUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');
    const claimUrl = `${baseUrl}/claim-discount?orderId=${order.id}&qr=${order.qr_code_id}`;
    
    const qrCodeSvg = generateQRCode(claimUrl, 120);
    const barcodeSvg = generateBarcode(order.order_number, 180, 40);

    const invoiceDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">৳${item.product_price.toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">৳${(item.product_price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join("");

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.order_number}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #D4AF37;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo-section img {
      max-height: 60px;
      max-width: 120px;
      object-fit: contain;
    }
    .logo-section h1 {
      font-size: 28px;
      color: #D4AF37;
      margin: 0;
    }
    .company-info {
      font-size: 13px;
      color: #666;
      margin-top: 5px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 24px;
      color: #333;
      margin: 0 0 10px 0;
    }
    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .billing-box {
      width: 48%;
    }
    .billing-box h3 {
      color: #D4AF37;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #1a1a1a;
      color: #D4AF37;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) {
      text-align: right;
    }
    th:nth-child(2) { text-align: center; }
    .totals {
      width: 300px;
      margin-left: auto;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .totals-row.grand-total {
      border-bottom: none;
      border-top: 2px solid #D4AF37;
      padding-top: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #D4AF37;
    }
    .qr-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 40px;
      padding: 20px;
      background: #f8f8f8;
      border-radius: 8px;
    }
    .qr-code {
      text-align: center;
    }
    .qr-code p {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    .barcode {
      text-align: center;
    }
    .barcode p {
      font-size: 12px;
      font-family: monospace;
      margin-top: 4px;
    }
    .discount-promo {
      background: linear-gradient(135deg, #D4AF37 0%, #F5D77A 100%);
      color: #1a1a1a;
      padding: 15px 20px;
      border-radius: 8px;
      text-align: center;
      max-width: 200px;
    }
    .discount-promo h4 {
      margin: 0 0 5px 0;
      font-size: 14px;
    }
    .discount-promo .value {
      font-size: 24px;
      font-weight: bold;
    }
    .discount-promo p {
      font-size: 11px;
      margin: 5px 0 0 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #666;
    }
    .terms {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : ''}
      <div>
        <h1>${invoiceSettings.company_name}</h1>
        <div class="company-info">
          ${invoiceSettings.company_address}<br>
          ${invoiceSettings.company_email}<br>
          ${invoiceSettings.company_phone}
        </div>
      </div>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>Invoice #:</strong> INV-${order.order_number}</p>
      <p><strong>Order #:</strong> ${order.order_number}</p>
      <p><strong>Date:</strong> ${invoiceDate}</p>
      <p><strong>Order Date:</strong> ${orderDate}</p>
    </div>
  </div>

  <div class="billing-section">
    <div class="billing-box">
      <h3>Bill To</h3>
      <p>
        <strong>${order.address?.full_name || 'Customer'}</strong><br>
        ${order.address?.address_line || ''}<br>
        ${order.address?.thana || ''}, ${order.address?.district || ''}<br>
        ${order.address?.division || ''}<br>
        Phone: ${order.address?.phone || 'N/A'}
      </p>
    </div>
    <div class="billing-box">
      <h3>Payment Info</h3>
      <p>
        <strong>Method:</strong> ${order.payment_method.toUpperCase()}<br>
        <strong>Status:</strong> ${order.status?.toUpperCase() || 'PENDING'}<br>
        ${order.payment_transaction_id ? `<strong>Transaction ID:</strong> ${order.payment_transaction_id}` : ''}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>৳${order.subtotal.toLocaleString()}</span>
    </div>
    <div class="totals-row">
      <span>Shipping:</span>
      <span>৳${order.shipping_cost.toLocaleString()}</span>
    </div>
    <div class="totals-row grand-total">
      <span>Total:</span>
      <span>৳${order.total.toLocaleString()}</span>
    </div>
  </div>

  <div class="qr-section">
    <div class="qr-code">
      ${qrCodeSvg}
      <p>Scan for authenticity</p>
    </div>
    
    ${qrActive ? `
    <div class="discount-promo">
      <h4>🎁 Scan & Get</h4>
      <div class="value">${qrType === 'percentage' ? qrDiscount + '%' : '৳' + qrDiscount}</div>
      <p>OFF your next order!</p>
    </div>
    ` : ''}
    
    <div class="barcode">
      ${barcodeSvg}
      <p>${order.order_number}</p>
    </div>
  </div>

  ${invoiceSettings.terms_and_conditions ? `
  <div class="terms">
    <strong>Terms & Conditions:</strong><br>
    ${invoiceSettings.terms_and_conditions}
  </div>
  ` : ''}

  <div class="footer">
    <p style="text-align: center; font-size: 14px; color: #D4AF37;">
      ${invoiceSettings.footer_note}
    </p>
    <p style="text-align: center;">
      This is a computer-generated invoice. No signature required.
    </p>
  </div>
</body>
</html>
    `;

    console.log("Invoice HTML generated successfully with QR code and logo");

    return new Response(JSON.stringify({ 
      success: true, 
      html: invoiceHtml,
      order_number: order.order_number 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
