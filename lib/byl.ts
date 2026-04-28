interface BylInvoice {
  id: number
  status: string
  amount: number
  description: string
  number: string
  project_id: number
  due_date: string
  url: string
  created_at: string
  updated_at: string
}

interface BylCheckout {
  id: number
  url: string
  status: string
  mode: string
  amount_total: number
  amount_subtotal: number
  expires_at: string
  created_at: string
  updated_at: string
}

interface BylCheckoutItem {
  price_data: {
    unit_amount: number
    product_data: {
      name: string
      client_reference_id?: string
    }
  }
  quantity: number
  adjustable_quantity?: {
    enabled: boolean
    min?: number
    max?: number
  }
}

interface BylCheckoutRequest {
  success_url?: string
  cancel_url?: string
  items: BylCheckoutItem[]
  phone_number_collection?: boolean
  delivery_address_collection?: boolean
  customer_email?: string
  client_reference_id?: string
  discounts?: Array<{
    amount: number
    description: string
  }>
}

export class BylService {
  private baseUrl: string
  private projectId: string
  private token: string

  constructor() {
    this.baseUrl = process.env.BYL_API_URL || "https://byl.mn/api/v1"
    this.projectId = process.env.BYL_PROJECT_ID || ""
    this.token = process.env.BYL_ACCESS_TOKEN || ""
  }

  private getHeaders(): HeadersInit {
    return {
      "Authorization": `Bearer ${this.token}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  }

  async createInvoice(amount: number, description: string): Promise<BylInvoice> {
    const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/invoices`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        amount,
        description,
        auto_advance: true
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create Byl invoice: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  async createCheckout(checkoutData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Byl checkout creation failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      throw new Error(`Byl checkout creation error: ${error}`)
    }
  }

  async getInvoice(invoiceId: number): Promise<BylInvoice> {
    const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/invoices/${invoiceId}`, {
      method: "GET",
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get Byl invoice: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  async getCheckout(checkoutId: number): Promise<BylCheckout> {
    const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/checkouts/${checkoutId}`, {
      method: "GET",
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get Byl checkout: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  async voidInvoice(invoiceId: number): Promise<BylInvoice> {
    const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/invoices/${invoiceId}/void`, {
      method: "POST",
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to void Byl invoice: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  async deleteInvoice(invoiceId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/projects/${this.projectId}/invoices/${invoiceId}`, {
      method: "DELETE",
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to delete Byl invoice: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require("crypto")
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")
    
    return computedSignature === signature
  }
}

export const bylService = new BylService()
