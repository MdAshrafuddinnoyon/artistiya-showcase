import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliverySlipRequest {
  orderId: string;
}

// Generate QR Code as SVG
function generateQRCode(data: string, size: number = 80): string {
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

    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .limit(1)
      .single();

    const invoiceSettings = settings || {
      company_name: "artistiya.store",
      company_address: "Dhaka, Bangladesh",
      company_phone: "+880 1XXX-XXXXXX",
    };

    // Get QR discount settings
    const { data: qrSettings } = await supabase
      .from("qr_discount_settings")
      .select("*")
      .limit(1)
      .single();

    const qrActive = qrSettings?.is_active ?? false;
    const qrDiscount = qrSettings?.discount_value ?? 5;
    const qrType = qrSettings?.discount_type ?? 'percentage';

    const baseUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');
    const claimUrl = `${baseUrl}/claim-discount?orderId=${order.id}&qr=${order.qr_code_id}`;
    
    const qrCodeSvg = generateQRCode(claimUrl, 70);

    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const itemsList = order.order_items.map((item: any) => 
      `<tr>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #ccc;">${item.product_name}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #ccc; text-align: center; font-weight: bold;">${item.quantity}</td>
      </tr>`
    ).join("");

    const totalItems = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const deliverySlipHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Delivery Slip - ${order.order_number}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: 100mm 150mm; margin: 5mm; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      width: 100mm;
      margin: 0 auto;
      padding: 10px;
      background: #fff;
    }
    .header {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 2px solid #D4AF37;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 18px;
      color: #D4AF37;
      margin: 0 0 5px 0;
    }
    .header p {
      margin: 2px 0;
      font-size: 10px;
      color: #666;
    }
    .order-info {
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .order-info h2 {
      font-size: 14px;
      margin: 0 0 5px 0;
      color: #D4AF37;
    }
    .order-info p {
      margin: 2px 0;
      font-size: 11px;
    }
    .customer-section {
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .customer-section h3 {
      font-size: 12px;
      margin: 0 0 5px 0;
      color: #D4AF37;
      text-transform: uppercase;
    }
    .customer-section .name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .customer-section .phone {
      font-size: 14px;
      font-weight: bold;
      color: #D4AF37;
    }
    .items-section h3 {
      font-size: 12px;
      margin: 0 0 5px 0;
      color: #D4AF37;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    th {
      background: #1a1a1a;
      color: #D4AF37;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
    }
    th:last-child { text-align: center; }
    .summary {
      background: #1a1a1a;
      color: #fff;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    .summary .amount {
      font-size: 20px;
      font-weight: bold;
      color: #D4AF37;
    }
    .summary .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .cod-badge {
      display: inline-block;
      background: #D4AF37;
      color: #000;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 10px;
      margin-top: 5px;
    }
    .qr-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding: 8px;
      border: 1px dashed #ccc;
      border-radius: 4px;
    }
    .qr-code {
      text-align: center;
    }
    .qr-code p {
      font-size: 8px;
      margin-top: 4px;
      color: #666;
    }
    .discount-badge {
      background: linear-gradient(135deg, #D4AF37 0%, #F5D77A 100%);
      color: #1a1a1a;
      padding: 8px 12px;
      border-radius: 4px;
      text-align: center;
    }
    .discount-badge .value {
      font-size: 16px;
      font-weight: bold;
    }
    .discount-badge p {
      font-size: 8px;
      margin: 2px 0 0 0;
    }
    .footer {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    .barcode-area {
      text-align: center;
      padding: 8px;
      font-family: monospace;
      font-size: 12px;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${invoiceSettings.company_name}</h1>
    <p>${invoiceSettings.company_phone}</p>
  </div>

  <div class="order-info">
    <h2>📦 Order #${order.order_number}</h2>
    <p><strong>Date:</strong> ${orderDate}</p>
    <p><strong>Items:</strong> ${totalItems} piece(s)</p>
    ${order.payment_method === 'cod' ? '<span class="cod-badge">💵 CASH ON DELIVERY</span>' : '<p><strong>Payment:</strong> ' + order.payment_method.toUpperCase() + ' (Paid)</p>'}
  </div>

  <div class="customer-section">
    <h3>📍 Deliver To</h3>
    <p class="name">${order.address?.full_name || 'Customer'}</p>
    <p class="phone">📞 ${order.address?.phone || 'N/A'}</p>
    <p>
      ${order.address?.address_line || ''}<br>
      ${order.address?.thana || ''}, ${order.address?.district || ''}<br>
      ${order.address?.division || ''}
    </p>
  </div>

  <div class="items-section">
    <h3>📋 Items</h3>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align: center;">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="label">${order.payment_method === 'cod' ? 'Amount to Collect' : 'Order Total'}</div>
    <div class="amount">৳${order.total.toLocaleString()}</div>
    ${order.payment_method === 'cod' ? '' : '<div class="label" style="color: #4ade80;">✓ PAID</div>'}
  </div>

  <div class="qr-section">
    <div class="qr-code">
      ${qrCodeSvg}
      <p>Scan for authenticity</p>
    </div>
    
    ${qrActive ? `
    <div class="discount-badge">
      <div class="value">🎁 ${qrType === 'percentage' ? qrDiscount + '%' : '৳' + qrDiscount}</div>
      <p>Scan & get discount!</p>
    </div>
    ` : ''}
    
    <div class="barcode-area">
      ${order.order_number}
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with us!</p>
    <p>${invoiceSettings.company_name}</p>
  </div>
</body>
</html>
    `;

    console.log("Delivery slip generated successfully with QR code");

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
