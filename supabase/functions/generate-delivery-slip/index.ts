import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliverySlipRequest {
  orderId: string;
}

// Generate Barcode as SVG
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId }: DeliverySlipRequest = await req.json();
    console.log(`Generating delivery slip for order: ${orderId}`);

    const { data: order, error: orderError } = await supabase
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
      throw new Error("Order not found");
    }

    // Get invoice settings
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .limit(1)
      .single();

    // Get site branding
    const { data: siteBranding } = await supabase
      .from("site_branding")
      .select("logo_url, business_name")
      .limit(1)
      .single();

    const invoiceSettings = settings || {
      company_name: siteBranding?.business_name || "artistiya.store",
      company_address: "Dhaka, Bangladesh",
      company_phone: "+880 1XXX-XXXXXX",
    };

    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const printDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const itemsList = order.order_items.map((item: any) => 
      `<tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px;">${item.product_name}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: 700; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px;">৳${item.product_price.toLocaleString()}</td>
      </tr>`
    ).join("");

    const totalItems = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const barcodeSvg = generateBarcode(order.order_number, 160, 40);

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
    
    /* Header Section */
    .header {
      text-align: center;
      padding: 10px 0;
      border-bottom: 3px solid #D4AF37;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .header .tagline {
      font-size: 10px;
      color: #D4AF37;
      margin-top: 2px;
      letter-spacing: 1px;
    }
    
    /* Order Info Box */
    .order-box {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #fff;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .order-box .order-number {
      font-size: 16px;
      font-weight: 700;
      color: #D4AF37;
      margin-bottom: 6px;
    }
    .order-box .meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #ccc;
    }
    .order-box .badge {
      display: inline-block;
      background: #D4AF37;
      color: #1a1a1a;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      margin-top: 8px;
    }
    .order-box .badge.paid {
      background: #22c55e;
      color: #fff;
    }
    
    /* Customer Section */
    .customer-section {
      border: 2px solid #1a1a1a;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .customer-section .label {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .customer-section .name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .customer-section .phone {
      font-size: 15px;
      font-weight: 700;
      color: #D4AF37;
      margin-bottom: 6px;
    }
    .customer-section .address {
      font-size: 12px;
      color: #444;
      line-height: 1.5;
    }
    
    /* Items Table */
    .items-section {
      margin-bottom: 10px;
    }
    .items-section .label {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 1px;
      margin-bottom: 6px;
      padding-left: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fafafa;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background: #1a1a1a;
      color: #D4AF37;
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3) { text-align: right; }
    
    /* Amount Box */
    .amount-box {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 10px;
    }
    .amount-box .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
      margin-bottom: 4px;
    }
    .amount-box .amount {
      font-size: 26px;
      font-weight: 700;
      color: #D4AF37;
    }
    .amount-box .status {
      font-size: 11px;
      color: #22c55e;
      margin-top: 4px;
    }
    
    /* Barcode Section */
    .barcode-section {
      text-align: center;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .barcode-section p {
      font-size: 11px;
      font-family: 'Courier New', monospace;
      color: #666;
      margin-top: 4px;
      letter-spacing: 2px;
    }
    
    /* Signature Section */
    .signature-section {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }
    .signature-box {
      flex: 1;
      text-align: center;
      padding: 8px;
      border: 1px dashed #ccc;
      border-radius: 6px;
    }
    .signature-box .line {
      border-bottom: 1px solid #999;
      height: 30px;
      margin-bottom: 4px;
    }
    .signature-box .label {
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 8px;
      border-top: 1px solid #eee;
    }
    .footer p {
      font-size: 10px;
      color: #888;
      margin: 2px 0;
    }
    .footer .brand {
      font-weight: 600;
      color: #D4AF37;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>${invoiceSettings.company_name}</h1>
    <div class="tagline">DELIVERY SLIP</div>
  </div>

  <!-- Order Info -->
  <div class="order-box">
    <div class="order-number">📦 #${order.order_number}</div>
    <div class="meta">
      <span>Date: ${orderDate}</span>
      <span>Items: ${totalItems} pcs</span>
    </div>
    ${order.payment_method === 'cod' 
      ? '<span class="badge">💵 CASH ON DELIVERY</span>' 
      : '<span class="badge paid">✓ PREPAID</span>'
    }
  </div>

  <!-- Customer Info -->
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

  <!-- Items List -->
  <div class="items-section">
    <div class="label">📋 Package Contents</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
  </div>

  <!-- Amount -->
  <div class="amount-box">
    <div class="label">${order.payment_method === 'cod' ? 'Collect Amount' : 'Order Total'}</div>
    <div class="amount">৳${order.total.toLocaleString()}</div>
    ${order.payment_method !== 'cod' ? '<div class="status">✓ Payment Completed</div>' : ''}
  </div>

  <!-- Barcode -->
  <div class="barcode-section">
    ${barcodeSvg}
    <p>${order.order_number}</p>
  </div>

  <!-- Signature Section -->
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

  <!-- Footer -->
  <div class="footer">
    <p>Thank you for shopping with us!</p>
    <p class="brand">${invoiceSettings.company_name}</p>
    <p>Printed: ${printDate}</p>
  </div>
</body>
</html>
    `;

    console.log("Delivery slip generated successfully - modern design with signature area");

    return new Response(JSON.stringify({ 
      success: true, 
      html: deliverySlipHtml,
      order_number: order.order_number 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating delivery slip:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
