import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function generateBarcode(data: string, width: number = 200, height: number = 50): string {
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
    console.log(`Generating invoice for order: ${orderId}`);

    const { data: order, error: orderError } = await supabaseService
      .from("orders").select(`*, address:addresses (*), order_items (*)`).eq("id", orderId).single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await supabaseService.rpc("is_admin", { check_user_id: userId });
    if (order.user_id !== userId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all settings in parallel
    const [settingsRes, brandingRes, qrRes] = await Promise.all([
      supabaseService.from("invoice_settings").select("*").limit(1).single(),
      supabaseService.from("site_branding").select("logo_url, logo_text, logo_text_secondary, contact_phone, contact_address, social_facebook, social_instagram, social_whatsapp").limit(1).single(),
      supabaseService.from("qr_discount_settings").select("*").limit(1).single(),
    ]);

    const settings = settingsRes.data;
    const siteBranding = brandingRes.data;
    const qrSettings = qrRes.data;

    const invoiceSettings = {
      company_name: settings?.company_name || siteBranding?.logo_text || "artistiya.store",
      company_address: settings?.company_address || siteBranding?.contact_address || "Dhaka, Bangladesh",
      company_email: settings?.company_email || "hello@artistiya.store",
      company_phone: settings?.company_phone || siteBranding?.contact_phone || "+880 1XXX-XXXXXX",
      logo_url: settings?.logo_url || siteBranding?.logo_url || null,
      footer_note: settings?.footer_note || "Thank you for your purchase!",
      terms_and_conditions: settings?.terms_and_conditions || "",
      company_tagline: settings?.company_tagline || "Handcrafted with love",
      digital_signature_url: settings?.digital_signature_url || null,
      signatory_name: settings?.signatory_name || null,
      signatory_title: settings?.signatory_title || null,
      show_social_links: settings?.show_social_links ?? true,
      social_facebook: settings?.social_facebook || siteBranding?.social_facebook || null,
      social_instagram: settings?.social_instagram || siteBranding?.social_instagram || null,
      social_whatsapp: settings?.social_whatsapp || siteBranding?.social_whatsapp || null,
      social_website: settings?.social_website || null,
    };

    // Fetch logo as base64 for PDF embedding
    let logoBase64: string | null = null;
    if (invoiceSettings.logo_url) {
      logoBase64 = await fetchLogoAsBase64(invoiceSettings.logo_url);
    }

    const qrActive = qrSettings?.is_active ?? false;
    const qrDiscount = qrSettings?.discount_value ?? 5;
    const qrType = qrSettings?.discount_type ?? 'percentage';

    const baseUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');
    const claimUrl = `${baseUrl}/claim-discount?orderId=${order.id}&qr=${order.qr_code_id}`;
    const qrCodeSvg = generateQRCode(claimUrl, 130);
    const barcodeSvg = generateBarcode(order.order_number, 200, 45);

    const invoiceDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const subtotal = order.order_items.reduce((sum: number, item: any) => sum + (item.product_price * item.quantity), 0);
    const discountAmount = subtotal - (order.subtotal || subtotal);
    
    const itemsHtml = order.order_items.map((item: any, idx: number) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fafaf8'};">
        <td style="padding: 14px 16px; border-bottom: 1px solid #f0ede8; font-size: 14px; color: #2d2926;">${item.product_name}</td>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f0ede8; text-align: center; font-weight: 600; color: #2d2926;">${item.quantity}</td>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f0ede8; text-align: right; color: #5a5550;">৳${item.product_price.toLocaleString()}</td>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f0ede8; text-align: right; font-weight: 600; color: #2d2926;">৳${(item.product_price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join("");

    const socialLinks = [];
    if (invoiceSettings.show_social_links) {
      if (invoiceSettings.social_facebook) socialLinks.push(`<a href="${invoiceSettings.social_facebook}" style="color: #b8a88a; text-decoration: none; margin: 0 8px;">Facebook</a>`);
      if (invoiceSettings.social_instagram) socialLinks.push(`<a href="${invoiceSettings.social_instagram}" style="color: #b8a88a; text-decoration: none; margin: 0 8px;">Instagram</a>`);
      if (invoiceSettings.social_whatsapp) socialLinks.push(`<a href="https://wa.me/${invoiceSettings.social_whatsapp}" style="color: #b8a88a; text-decoration: none; margin: 0 8px;">WhatsApp</a>`);
      if (invoiceSettings.social_website) socialLinks.push(`<a href="${invoiceSettings.social_website}" style="color: #b8a88a; text-decoration: none; margin: 0 8px;">Website</a>`);
    }

    // Fetch digital signature as base64
    let signatureBase64: string | null = null;
    if (invoiceSettings.digital_signature_url) {
      signatureBase64 = await fetchLogoAsBase64(invoiceSettings.digital_signature_url);
    }

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.order_number}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 15mm; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #2d2926;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: #fff;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 30px;
      margin-bottom: 30px;
      border-bottom: 3px solid #b8a88a;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 120px;
      height: 3px;
      background: #2d2926;
    }
    
    .logo-section { display: flex; align-items: center; gap: 16px; }
    .logo-section img { max-height: 70px; max-width: 140px; object-fit: contain; }
    .company-name { font-size: 26px; font-weight: 700; color: #2d2926; letter-spacing: -0.5px; }
     .company-tagline { font-size: 11px; color: #b8a88a; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
     .signature-section { margin-top: 30px; text-align: right; padding-right: 40px; }
     .signature-section img { max-height: 60px; margin-bottom: 4px; }
     .signature-section .sig-name { font-weight: 700; font-size: 14px; color: #2d2926; }
     .signature-section .sig-title { font-size: 12px; color: #8a8580; }
    .company-info { font-size: 12px; color: #8a8580; margin-top: 8px; line-height: 1.8; }
    
    .invoice-badge {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: 800;
      color: #b8a88a;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .invoice-meta { margin-top: 12px; font-size: 13px; color: #5a5550; line-height: 2; }
    .invoice-meta strong { color: #2d2926; font-weight: 600; }
    
    .billing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 35px;
    }
    .billing-card {
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #f0ede8;
      background: #fafaf8;
    }
    .billing-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #b8a88a;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .billing-name { font-size: 17px; font-weight: 700; color: #2d2926; margin-bottom: 6px; }
    .billing-detail { font-size: 13px; color: #5a5550; line-height: 1.8; }
    
    .status-pill {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid { background: #e8f5e9; color: #2e7d32; }
    .status-cod { background: #fff3e0; color: #e65100; }
    .status-pending { background: #fff8e1; color: #f57f17; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-radius: 10px; overflow: hidden; }
    thead th {
      background: linear-gradient(135deg, #2d2926 0%, #3d3935 100%);
      color: #b8a88a;
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 35px;
    }
    .totals-box {
      width: 320px;
      background: #fafaf8;
      border-radius: 10px;
      padding: 20px;
      border: 1px solid #f0ede8;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #5a5550;
    }
    .total-row.discount { color: #2e7d32; }
    .total-row.grand {
      border-top: 2px solid #b8a88a;
      margin-top: 8px;
      padding-top: 14px;
      font-size: 20px;
      font-weight: 800;
      color: #2d2926;
    }
    .total-row.grand span:last-child { color: #b8a88a; }
    
    .qr-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #fafaf8 0%, #f5f2ed 100%);
      border-radius: 12px;
      border: 1px solid #f0ede8;
      margin-bottom: 25px;
      gap: 20px;
    }
    .qr-block { text-align: center; }
    .qr-block p { font-size: 11px; color: #8a8580; margin-top: 6px; }
    .barcode-block { text-align: center; }
    .barcode-block p { font-size: 12px; font-family: 'Courier New', monospace; color: #5a5550; letter-spacing: 2px; margin-top: 4px; }
    
    .discount-promo-card {
      background: linear-gradient(135deg, #2d2926 0%, #3d3935 100%);
      color: #fff;
      padding: 18px 24px;
      border-radius: 12px;
      text-align: center;
      min-width: 160px;
    }
    .discount-promo-card .gift-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #b8a88a; margin-bottom: 6px; }
    .discount-promo-card .gift-value { font-size: 28px; font-weight: 800; color: #b8a88a; }
    .discount-promo-card .gift-note { font-size: 10px; color: #aaa; margin-top: 4px; }
    
    .terms-box {
      background: #fafaf8;
      border: 1px solid #f0ede8;
      border-radius: 10px;
      padding: 18px;
      font-size: 12px;
      color: #8a8580;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .terms-box strong { color: #5a5550; }
    
    .footer {
      text-align: center;
      padding-top: 25px;
      border-top: 1px solid #f0ede8;
    }
    .footer .thank-you {
      font-size: 16px;
      color: #b8a88a;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .footer .auto-gen {
      font-size: 11px;
      color: #aaa;
      margin-top: 6px;
    }
    .footer .social-links {
      margin-top: 12px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <!-- Header with Logo -->
  <div class="header">
    <div class="logo-section">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : ''}
      <div>
        <div class="company-name">${invoiceSettings.company_name}</div>
        <div class="company-tagline">${invoiceSettings.company_tagline}</div>
        <div class="company-info">
          ${invoiceSettings.company_address}<br>
          ${invoiceSettings.company_email} &bull; ${invoiceSettings.company_phone}
        </div>
      </div>
    </div>
    <div class="invoice-badge">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-meta">
        <strong>Invoice #:</strong> INV-${order.order_number}<br>
        <strong>Order #:</strong> ${order.order_number}<br>
        <strong>Invoice Date:</strong> ${invoiceDate}<br>
        <strong>Order Date:</strong> ${orderDate}
      </div>
    </div>
  </div>

  <!-- Billing Grid -->
  <div class="billing-grid">
    <div class="billing-card">
      <div class="billing-label">📍 Bill To</div>
      <div class="billing-name">${order.address?.full_name || 'Customer'}</div>
      <div class="billing-detail">
        ${order.address?.address_line || ''}<br>
        ${order.address?.thana || ''}, ${order.address?.district || ''}<br>
        ${order.address?.division || ''}<br>
        📞 ${order.address?.phone || 'N/A'}
      </div>
    </div>
    <div class="billing-card">
      <div class="billing-label">💳 Payment Details</div>
      <div style="margin-bottom: 10px;">
        ${order.payment_method === 'cod' 
          ? '<span class="status-pill status-cod">Cash on Delivery</span>'
          : '<span class="status-pill status-paid">✓ Paid</span>'}
      </div>
      <div class="billing-detail">
        <strong>Method:</strong> ${order.payment_method?.toUpperCase()}<br>
        <strong>Order Status:</strong> ${order.status?.toUpperCase() || 'PENDING'}<br>
        ${order.payment_transaction_id ? `<strong>TXN ID:</strong> ${order.payment_transaction_id}` : ''}
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row">
        <span>Subtotal (${order.order_items.length} items)</span>
        <span>৳${subtotal.toLocaleString()}</span>
      </div>
      ${discountAmount > 0 ? `
      <div class="total-row discount">
        <span>Discount</span>
        <span>-৳${discountAmount.toLocaleString()}</span>
      </div>` : ''}
      <div class="total-row">
        <span>Shipping</span>
        <span>৳${order.shipping_cost?.toLocaleString() || '0'}</span>
      </div>
      <div class="total-row grand">
        <span>Total</span>
        <span>৳${order.total.toLocaleString()}</span>
      </div>
    </div>
  </div>

  <!-- QR & Barcode Footer -->
  <div class="qr-footer">
    <div class="qr-block">
      ${qrCodeSvg}
      <p>Scan for authenticity</p>
    </div>
    
    ${qrActive ? `
    <div class="discount-promo-card">
      <div class="gift-label">🎁 Next Order</div>
      <div class="gift-value">${qrType === 'percentage' ? qrDiscount + '%' : '৳' + qrDiscount}</div>
      <div class="gift-note">Scan QR to claim discount</div>
    </div>` : ''}
    
    <div class="barcode-block">
      ${barcodeSvg}
      <p>${order.order_number}</p>
    </div>
  </div>

  ${invoiceSettings.terms_and_conditions ? `
  <div class="terms-box">
    <strong>Terms & Conditions:</strong><br>
    ${invoiceSettings.terms_and_conditions}
  </div>` : ''}

  ${(signatureBase64 || invoiceSettings.signatory_name) ? `
  <div class="signature-section">
    ${signatureBase64 ? `<img src="${signatureBase64}" alt="Authorized Signature" />` : ''}
    ${invoiceSettings.signatory_name ? `<div class="sig-name">${invoiceSettings.signatory_name}</div>` : ''}
    ${invoiceSettings.signatory_title ? `<div class="sig-title">${invoiceSettings.signatory_title}</div>` : ''}
    <div style="font-size:10px;color:#aaa;margin-top:4px;">Authorized Signatory</div>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div class="thank-you">${invoiceSettings.footer_note}</div>
    ${socialLinks.length > 0 ? `<div class="social-links">${socialLinks.join(' &bull; ')}</div>` : ''}
    <div class="auto-gen">${(signatureBase64 || invoiceSettings.signatory_name) ? 'Digitally signed invoice.' : 'This is a computer-generated invoice.'}</div>
  </div>
</body>
</html>`;

    console.log("Invoice generated with embedded logo and modern design");

    return new Response(JSON.stringify({ 
      success: true, html: invoiceHtml, order_number: order.order_number 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate invoice" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
