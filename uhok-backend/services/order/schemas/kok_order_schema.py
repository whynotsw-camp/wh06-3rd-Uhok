from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from services.order.schemas.common_schema import StatusMasterSchema

# -----------------------------
# 장바구니 선택 주문 스키마
# -----------------------------

class KokCartOrderItem(BaseModel):
    kok_cart_id: int = Field(..., description="장바구니 ID")
    quantity: int = Field(..., ge=1, description="주문 수량")

class KokCartOrderRequest(BaseModel):
    selected_items: List[KokCartOrderItem]

class KokOrderDetail(BaseModel):
    kok_order_id: int
    kok_product_id: int
    kok_product_name: str
    quantity: int
    unit_price: int
    total_price: int

class KokCartOrderResponse(BaseModel):
    order_id: int
    total_amount: int
    order_count: int
    order_details: List[KokOrderDetail]
    message: str
    order_time: datetime

# -----------------------------
# 주문 상태 관련 스키마
# -----------------------------

class KokOrderSchema(BaseModel):
    kok_order_id: int
    kok_price_id: int
    kok_product_id: int
    quantity: int
    order_price: Optional[int]
    recipe_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class KokOrderStatusHistorySchema(BaseModel):
    """콕 주문 상태 변경 이력 스키마"""
    history_id: int
    kok_order_id: int
    status: StatusMasterSchema
    changed_at: datetime
    changed_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class KokOrderStatusUpdate(BaseModel):
    """콕 주문 상태 업데이트 요청"""
    new_status_code: str
    changed_by: Optional[int] = None

class KokOrderStatusResponse(BaseModel):
    """콕 주문 상태 응답"""
    kok_order_id: int
    current_status: Optional[StatusMasterSchema] = None
    status_history: List[KokOrderStatusHistorySchema] = []
    
    class Config:
        from_attributes = True

class KokOrderWithStatusResponse(BaseModel):
    """콕 주문과 현재 상태를 함께 응답"""
    kok_order: KokOrderSchema
    current_status: Optional[StatusMasterSchema] = None
    
    class Config:
        from_attributes = True

class KokNotificationSchema(BaseModel):
    """콕 알림 스키마"""
    notification_id: int
    user_id: int
    kok_order_id: int
    status_id: int
    title: str
    message: str
    created_at: datetime
    # 추가 정보
    order_status: Optional[str] = None  # 주문 상태 코드
    order_status_name: Optional[str] = None  # 주문 상태명
    product_name: Optional[str] = None  # 상품명
    
    class Config:
        from_attributes = True

class KokNotificationListResponse(BaseModel):
    """콕 알림 목록 응답"""
    notifications: List[KokNotificationSchema] = []
    total_count: int = 0
    
    class Config:
        from_attributes = True
