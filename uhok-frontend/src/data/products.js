// 이미지 import

// 기본 제품 3개 정의
const product1 = {
  id: 1,
  name: "예천 청결고추 | 국내산 청결 햇고춧가루 4kg (500g 8팩)",
  originalPrice: 150000,
  discountPrice: 124000,
  discountRate: 17,
  image: '',
  rating: 4.4,
  reviewCount: 23,
  isSpecial: true
};

const product2 = {
  id: 2,
  name: "전라도식 파김치",
  originalPrice: 13600,
  discountPrice: 13600,
  discountRate: 51,
  image: '',
  rating: 4.1,
  reviewCount: 17
};

const product3 = {
  id: 3,
  name: "햅쌀",
  originalPrice: 25000,
  discountPrice: 20900,
  discountRate: 16,
  image: '',
  rating: 4.8,
  reviewCount: 24,
  isSpecial: true
};

// 제품 ID에 따라 기본 제품 반환하는 함수
const getBaseProduct = (productId) => {
  const id = parseInt(productId);
  if (id === 1) return product1;
  if (id === 2) return product2;
  if (id === 3) return product3;
  return null;
};

// 각 섹션별로 동일한 제품을 여러 개 생성 (고유 ID 부여)
const generateProducts = (baseProduct, count = 20) => {
  return Array.from({ length: count }, (_, index) => ({
    ...baseProduct,
    id: baseProduct.id + (index * 1000) // 섹션별로 고유한 ID 생성
  }));
};

export const discountProducts = generateProducts(product1, 20);
export const highSellingProducts = generateProducts(product2, 20);
export const nonDuplicatedProducts = generateProducts(product3, 20);

// ProductDetail에서 사용할 상세 제품 데이터
export const getProductDetail = (productId) => {
  const baseProduct = getBaseProduct(productId);
  
  if (baseProduct) {
    // 기본 제품 정보에 상세 정보 추가
    return {
      ...baseProduct,
      id: parseInt(productId), // 요청된 ID로 설정
      description: getProductDescription(productId),
      details: getProductDetails(productId),
      seller: getSellerInfo(),
      reviews: getProductReviews(productId),
      ratingDistribution: getRatingDistribution(productId),
      feedback: getProductFeedback(productId)
    };
  }
  
  return null;
};

// 제품별 설명
const getProductDescription = (productId) => {
  const id = parseInt(productId);
  if (id === 1) {
    return "예천 청결고추로 만든 특별한 고춧가루입니다. 진한 붉은색과 강한 매운맛이 특징입니다. 햇고추의 신선함을 그대로 담아낸 프리미엄 고춧가루입니다.";
  } else if (id === 2) {
    return "당일제조 전라도식 김치 파김치입니다. 신선한 파와 특제 양념으로 만든 전통적인 맛을 느껴보세요. 매콤달콤한 맛이 특징입니다.";
  } else if (id === 3) {
    return "신선한 햅쌀입니다. 쫄깃한 식감과 고소한 맛이 특징입니다. 매일 아침 밥상에 올릴 수 있는 최고급 쌀입니다.";
  }
  
  return "이 제품에 대한 상세한 설명입니다.";
};

// 제품별 상세 정보
const getProductDetails = (productId) => {
  const id = parseInt(productId);
  if (id === 1) {
    return {
      weight: "4kg (500g 8팩)",
      origin: "국내산",
      expiryDate: "제조일로부터 24개월",
      storage: "서늘하고 건조한 곳에 보관"
    };
  } else if (id === 2) {
    return {
      weight: "500g",
      origin: "국내산",
      expiryDate: "제조일로부터 18개월",
      storage: "서늘하고 건조한 곳에 보관"
    };
  } else if (id === 3) {
    return {
      weight: "10kg",
      origin: "국내산",
      expiryDate: "제조일로부터 12개월",
      storage: "서늘하고 건조한 곳에 보관"
    };
  }
  
  return {
    weight: "상품별 상이",
    origin: "국내산",
    expiryDate: "제조일로부터 12개월",
    storage: "서늘하고 건조한 곳에 보관"
  };
};

// 판매자 정보
const getSellerInfo = () => ({
  name: "(주)컴퍼니와우",
  representative: "(주)컴퍼니와우",
  businessNumber: "119-86-54463",
  onlineSalesNumber: "제2012-서울금천-0325호",
  phone: "02-2038-2966",
  certifiedItems: "사업자 번호, 사업자 상호",
  certificationDate: "2024-05-21",
  businessLocation: "서울 금천구 가산디지털1로 70 (가산동) 407호",
  returnAddress: "08590 서울 금천구 가산디지털1로 70 407호",
  exchangeAddress: "08590 서울 금천구 가산디지털1로 70 407호"
});

// 제품별 리뷰
const getProductReviews = (productId) => {
  const id = parseInt(productId);
  if (id === 1) {
    return [
      {
        id: 1,
        user: "조**",
        rating: 5,
        date: "2025.08.01",
        comment: "가격 적당해요 배송 괜찮네요 맛 먹을만해요 파김치가 아주 맛있어요."
      },
      {
        id: 2,
        user: "김**",
        rating: 5,
        date: "2025.07.28",
        comment: "품질이 좋고 맛있어요. 다음에도 구매할 예정입니다."
      }
    ];
  } else if (id === 2) {
    return [
      {
        id: 1,
        user: "이**",
        rating: 4,
        date: "2025.08.01",
        comment: "맛있어요! 전라도식 파김치 맛이 나요."
      }
    ];
  } else if (id === 3) {
    return [
      {
        id: 1,
        user: "박**",
        rating: 5,
        date: "2025.08.01",
        comment: "쫄깃하고 맛있어요. 다음에도 구매할 예정입니다."
      }
    ];
  }
  
  return [
    {
      id: 1,
      user: "고객**",
      rating: 5,
      date: "2025.08.01",
      comment: "좋은 제품입니다."
    }
  ];
};

// 제품별 평점 분포
const getRatingDistribution = (productId) => {
  const id = parseInt(productId);
  if (id === 1) {
    return { 5: 80, 4: 0, 3: 0, 2: 0, 1: 0 };
  } else if (id === 2) {
    return { 5: 60, 4: 40, 3: 0, 2: 0, 1: 0 };
  } else if (id === 3) {
    return { 5: 90, 4: 10, 3: 0, 2: 0, 1: 0 };
  }
  
  return { 5: 80, 4: 0, 3: 0, 2: 0, 1: 0 };
};

// 제품별 피드백
const getProductFeedback = (productId) => {
  const id = parseInt(productId);
  if (id === 1) {
    return { "가격 저렴해요": 47, "배송 빨라요": 37 };
  } else if (id === 2) {
    return { "맛있어요": 30, "신선해요": 25 };
  } else if (id === 3) {
    return { "품질 좋아요": 45, "맛있어요": 35 };
  }
  
  return { "품질 좋아요": 50, "맛있어요": 30 };
}; 