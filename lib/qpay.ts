interface QPayInvoiceRequest {
  invoice_code: string
  sender_invoice_no: string
  invoice_receiver_code: string
  invoice_description: string
  amount: number
  callback_url?: string
}

interface QPayInvoiceResponse {
  invoice_id: string
  qr_text: string
  qr_image: string
  urls: Array<{
    name: string
    description: string
    logo: string
    link: string
  }>
}

interface QPayPaymentCheck {
  payment_id: string
  payment_status: string
  payment_amount: number
  payment_currency: string
  payment_wallet: string
}

export class QPayService {
  private baseUrl: string
  private username: string
  private password: string
  private invoiceCode: string

  constructor() {
    // Support both QPAY_BASE_URL and QPAY_API_URL env var names
    const rawUrl = process.env.QPAY_BASE_URL || process.env.QPAY_API_URL || "https://merchant.qpay.mn"
    // Strip trailing /v2 or /v2/ so we always control the path ourselves
    this.baseUrl = rawUrl.replace(/\/v2\/?$/, "").replace(/\/$/, "")
    this.username = process.env.QPAY_USERNAME || ""
    this.password = process.env.QPAY_PASSWORD || ""
    // Support both QPAY_INVOICE_CODE and QPAY_MERCHANT_CODE
    this.invoiceCode = process.env.QPAY_INVOICE_CODE || process.env.QPAY_MERCHANT_CODE || ""
  }

  private async getAccessToken(): Promise<string> {
    if (!this.username || !this.password) {
      throw new Error("QPay тохиргоо дутуу байна: QPAY_USERNAME ба QPAY_PASSWORD env var тохируулна уу")
    }

    const cleanBaseUrl = this.baseUrl
    const authUrl = `${cleanBaseUrl}/v2/auth/token`
    
    // QPay authentication in progress

    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get QPay access token: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const responseText = await response.text()
    
    try {
      const data = JSON.parse(responseText)
      return data.access_token
    } catch (parseError) {
      throw new Error(`Invalid JSON response from QPay: ${responseText.substring(0, 200)}...`)
    }
  }

  async createInvoice(
    amount: number,
    description: string,
    senderInvoiceNo: string,
    callbackUrl?: string,
  ): Promise<QPayInvoiceResponse> {
    if (!this.invoiceCode) {
      throw new Error("QPay invoice code тохируулаагүй байна: QPAY_INVOICE_CODE эсвэл QPAY_MERCHANT_CODE env var тохируулна уу")
    }

    const token = await this.getAccessToken()

    const invoiceData: QPayInvoiceRequest = {
      invoice_code: this.invoiceCode,
      sender_invoice_no: senderInvoiceNo,
      invoice_receiver_code: "terminal",
      invoice_description: description,
      amount: amount,
      callback_url: callbackUrl,
    }

    // Ensure baseUrl doesn't end with a slash
    const cleanBaseUrl = this.baseUrl.replace(/\/$/, '')
    const invoiceUrl = `${cleanBaseUrl}/v2/invoice`

    const response = await fetch(invoiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invoiceData),
    })

    if (!response.ok) {
      throw new Error("Failed to create QPay invoice")
    }

    return await response.json()
  }

  async checkPayment(invoiceId: string): Promise<QPayPaymentCheck> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/v2/payment/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        object_type: "INVOICE",
        object_id: invoiceId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to check QPay payment")
    }

    return await response.json()
  }
}

export const qpayService = new QPayService()
