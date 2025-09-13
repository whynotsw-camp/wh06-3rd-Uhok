from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from services.order.schemas.common_schema import StatusMasterSchema

# -----------------------------
# 주문 관련 스키마
# -----------------------------

class HomeshoppingOrderRequest(BaseModel):
    """홈쇼핑 주문 생성 요청 (단건 주문)"""
    product_id: int = Field(..., description="상품 ID")
    quantity: int = Field(1, ge=1, le=99, description="주문 수량")
    
    class Config:
        from_attributes = True


class HomeshoppingOrderResponse(BaseModel):
    """홈쇼핑 주문 생성 응답"""
    order_id: int = Field(..., description="주문 고유번호")
    homeshopping_order_id: int = Field(..., description="홈쇼핑 주문 상세 고유번호")
    product_id: int = Field(..., description="상품 ID")
    product_name: str = Field(..., description="상품명")
    quantity: int = Field(..., description="주문 수량")
    dc_price: int = Field(..., description="할인가")
    order_price: int = Field(..., description="주문 금액")
    order_time: datetime = Field(..., description="주문 시간")
    message: str = Field(..., description="응답 메시지")
    
    class Config:
        from_attributes = True


class HomeshoppingOrderSchema(BaseModel):
    """홈쇼핑 주문 상세 스키마 (OrderRead에서 사용)"""
    homeshopping_order_id: int
    product_id: int
    dc_price: int
    quantity: int
    order_price: Optional[int]
    
    class Config:
        from_attributes = True

# -----------------------------
# 주문 상태 관련 스키마
# -----------------------------

class HomeshoppingOrderStatusHistorySchema(BaseModel):
    """홈쇼핑 주문 상태 변경 이력 스키마"""
    history_id: int
    homeshopping_order_id: int
    status: StatusMasterSchema
    created_at: datetime
    
    class Config:
        from_attributes = True


class HomeshoppingOrderStatusResponse(BaseModel):
    """홈쇼핑 주문 상태 조회 응답"""
    homeshopping_order_id: int = Field(..., description="홈쇼핑 주문 상세 ID")
    current_status: StatusMasterSchema = Field(..., description="현재 상태")
    status_history: list[HomeshoppingOrderStatusHistorySchema] = Field(default_factory=list, description="상태 변경 이력")
    
    class Config:
        from_attributes = True


class HomeshoppingOrderWithStatusResponse(BaseModel):
    """홈쇼핑 주문과 상태 함께 조회 응답"""
    order_id: int = Field(..., description="주문 고유번호")
    homeshopping_order_id: int = Field(..., description="홈쇼핑 주문 상세 고유번호")
    product_id: int = Field(..., description="상품 ID")
    product_name: str = Field(..., description="상품명")
    quantity: int = Field(..., description="주문 수량")
    dc_price: int = Field(..., description="할인가")
    order_price: int = Field(..., description="주문 금액")
    order_time: datetime = Field(..., description="주문 시간")
    current_status: StatusMasterSchema = Field(..., description="현재 상태")
    
    class Config:
        from_attributes = True


class PaymentConfirmResponse(BaseModel):
    """결제 확인 응답"""
    homeshopping_order_id: int = Field(..., description="홈쇼핑 주문 상세 ID")
    previous_status: str = Field(..., description="이전 상태")
    current_status: str = Field(..., description="현재 상태")
    message: str = Field(..., description="응답 메시지")
    
    class Config:
        from_attributes = True


class AutoUpdateResponse(BaseModel):
    """자동 상태 업데이트 시작 응답"""
    homeshopping_order_id: int = Field(..., description="홈쇼핑 주문 상세 ID")
    message: str = Field(..., description="응답 메시지")
    auto_update_started: bool = Field(..., description="자동 업데이트 시작 여부")
    
    class Config:
        from_attributes = True
    