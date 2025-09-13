// 홈쇼핑 로고 이미지들
import homeshoppingLogoHomeandshopping from '../assets/homeshopping_logo_homeand.png';
import homeshoppingLogoHyundai from '../assets/homeshopping_logo_hyundai.png';
import homeshoppingLogoNs from '../assets/homeshopping_logo_ns.png';
import homeshoppingLogoNsplus from '../assets/homeshopping_logo_nsplus.png';
import homeshoppingLogoPlusshop from '../assets/homeshopping_logo_plusshop.png';
import homeshoppingLogoPublicshopping from '../assets/homeshopping_logo_publicshopping_re.png';
import homeshoppingLogoGsshop from '../assets/homeshopping_logo_gsmyshop.png';
import homeshoppingLogoGsshoplive from '../assets/homeshopping_logo_gsshoplive.png';
import homeshoppingLogoGsmyShop from '../assets/homeshopping_logo_gsmyshop.png';
import homeshoppingLogoCjoneStyle from '../assets/homeshopping_logo_cjonestyle.png';
import homeshoppingLogoCjoneStylePlus from '../assets/homeshopping_logo_cjonstyleplus___.png';
import homeshoppingLogoLotteHomeShopping from '../assets/homeshopping_logo_lottehomeshopping.png';
import homeshoppingLogoLotteOneTv from '../assets/homeshopping_logo_lotteonetv.png';
import homeshoppingLogoKtAlphaShopping from '../assets/homeshopping_logo_ktalphashopping2 (2).png';
import homeshoppingLogoSkStoa from '../assets/homeshopping_logo_skstoa.png';
import homeshoppingLogoShinSegaEShopping from '../assets/homeshopping_logo_shinsegaeshopping.png';
import homeshoppingLogoWshopping from '../assets/homeshopping_logo_wshopping.png';
import homeshoppingLogoShoppingEnter from '../assets/homeshopping_logo_shoppingenter.jpg';

// 홈쇼핑사 데이터
export const homeshoppingChannels = [
  {
    id: 1,
    name: "홈앤쇼핑",
    logo: homeshoppingLogoHomeandshopping,
    channel: 4
  },
  {
    id: 2,
    name: "현대홈쇼핑",
    logo: homeshoppingLogoHyundai,
    channel: 12
  },
  {
    id: 3,
    name: "현대홈쇼핑+샵",
    logo: homeshoppingLogoPlusshop,
    channel: 34
  },
  {
    id: 4,
    name: "NS홈쇼핑",
    logo: homeshoppingLogoNs,
    channel: 13
  },
  {
    id: 5,
    name: "NS샵+",
    logo: homeshoppingLogoNsplus,
    channel: 41
  },

  {
    id: 7,
    name: "GS샵 LIVE",
    logo: homeshoppingLogoGsshoplive,
    channel: 6
  },
  {
    id: 8,
    name: "GS마이샵",
    logo: homeshoppingLogoGsmyShop,
    channel: 30
  },
  {
    id: 9,
    name: "CJ온스타일",
    logo: homeshoppingLogoCjoneStyle,
    channel: 8
  },
  {
    id: 10,
    name: "CJ온스타일플러스",
    logo: homeshoppingLogoCjoneStylePlus,
    channel: 32
  },
  {
    id: 11,
    name: "롯데홈쇼핑",
    logo: homeshoppingLogoLotteHomeShopping,
    channel: 10
  },
  {
    id: 12,
    name: "롯데 OneTV",
    logo: homeshoppingLogoLotteOneTv,
    channel: 36
  },
  {
    id: 13,
    name: "KT 알파쇼핑",
    logo: homeshoppingLogoKtAlphaShopping,
    channel: 2
  },
  {
    id: 14,
    name: "SK 스토어",
    logo: homeshoppingLogoSkStoa,
    channel: 17
  },
  {
    id: 15,
    name: "신세계쇼핑",
    logo: homeshoppingLogoShinSegaEShopping,
    channel: 21
  },
  {
    id: 16,
    name: "W쇼핑",
    logo: homeshoppingLogoWshopping,
    channel: 28
  },
  {
    id: 17,
    name: "쇼핑엔터",
    logo: homeshoppingLogoShoppingEnter,
    channel: 37
  },
  {
    id: 18,
    name: "공영쇼핑",
    logo: homeshoppingLogoPublicshopping,
    channel: 20
  }
];

// homeshopping_id로 로고 찾기
export const getLogoByHomeshoppingId = (homeshoppingId) => {
  const channel = homeshoppingChannels.find(ch => ch.id === homeshoppingId);
  return channel;
};

// homeshopping_id로 채널 정보 찾기
export const getChannelInfoByHomeshoppingId = (homeshoppingId) => {
  const channel = homeshoppingChannels.find(ch => ch.id === homeshoppingId);
  return channel;
};

export default homeshoppingChannels;
