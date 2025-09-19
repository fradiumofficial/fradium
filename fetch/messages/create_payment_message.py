from uagents import Model

class CreatePaymentMessage(Model):
    order_id: str
    asset: str
    amount: float
    customer_id: str
    target_address: str
    principal: str

class CreatePaymentResponse(Model):
    message: str
    success: bool
    order_id: str
    payment_url: str