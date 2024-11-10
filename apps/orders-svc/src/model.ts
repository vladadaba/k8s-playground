export class OrderDto {
  productId: string;
  quantity: number;
  constructor(productId: string, quantity: number) {
    this.productId = productId;
    this.quantity = quantity;
  }
}
export class ApproveOrderDto {
  orderId: string;
  isApproved: boolean;
  constructor(orderId: string, isApproved: boolean) {
    this.orderId = orderId;
    this.isApproved = isApproved;
  }
}

export class PurchaseDto {
  productId: string;
  quantity: number;
  constructor(productId: string, quantity: number) {
    this.productId = productId;
    this.quantity = quantity;
  }
}
