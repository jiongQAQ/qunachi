/**
 * Mock 数据模块
 * 用于开发阶段模拟高德地图 API 返回数据
 * 通过 NEXT_PUBLIC_USE_MOCKS=1 环境变量控制
 */

export interface MockGeocodeResult {
  formattedAddress: string;
  province: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
}

export interface MockPoiResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  type: string;
  phone?: string;
}

// 三元桥附近真实坐标（用于 Mock 数据）
export const MOCK_BASE_LOCATION = {
  // 三元桥凤凰城附近
  lng: 116.456789,
  lat: 39.987654,
};

// 模拟地址列表
export const MOCK_ADDRESSES = [
  "北京市朝阳区三元桥凤凰城商场B1层",
  "北京市朝阳区曙光西里甲5号凤凰城商场",
  "北京市朝阳区东三环北路甲19号",
  "北京市朝阳区三元桥南银大厦",
  "北京市朝阳区霄云路甲19号",
  "北京市朝阳区三元桥地铁站",
];

// 模拟餐厅数据
export const MOCK_RESTAURANTS: MockPoiResult[] = [
  {
    id: "mock_poi_001",
    name: "绿茶餐厅",
    address: "凤凰城商场3层",
    lat: 39.988654,
    lng: 116.457789,
    distance: 120,
    type: "中餐|江浙菜",
    phone: "010-84567890",
  },
  {
    id: "mock_poi_002",
    name: "鼎泰丰",
    address: "凤凰城商场B1层",
    lat: 39.987254,
    lng: 116.455989,
    distance: 85,
    type: "中餐|小吃",
    phone: "010-84567891",
  },
  {
    id: "mock_poi_003",
    name: "西贝莜面村",
    address: "曙光西里甲5号",
    lat: 39.989154,
    lng: 116.458789,
    distance: 200,
    type: "中餐|西北菜",
    phone: "010-84567892",
  },
  {
    id: "mock_poi_004",
    name: "避风塘",
    address: "三元桥南银大厦1层",
    lat: 39.986654,
    lng: 116.454789,
    distance: 310,
    type: "中餐|茶餐厅",
    phone: "010-84567893",
  },
  {
    id: "mock_poi_005",
    name: "新元素",
    address: "凤凰城商场2层",
    lat: 39.988254,
    lng: 116.457289,
    distance: 150,
    type: "西餐|轻食",
    phone: "010-84567894",
  },
  {
    id: "mock_poi_006",
    name: "鹿港小镇",
    address: "曙光西里甲5号2层",
    lat: 39.989554,
    lng: 116.458389,
    distance: 250,
    type: "中餐|台菜",
    phone: "010-84567895",
  },
  {
    id: "mock_poi_007",
    name: "度小月",
    address: "凤凰城商场3层",
    lat: 39.988754,
    lng: 116.457589,
    distance: 180,
    type: "中餐|台湾菜",
    phone: "010-84567896",
  },
  {
    id: "mock_poi_008",
    name: "旺角亭",
    address: "三元桥南银大厦2层",
    lat: 39.986254,
    lng: 116.454389,
    distance: 420,
    type: "中餐|港式餐厅",
    phone: "010-84567897",
  },
  {
    id: "mock_poi_009",
    name: "眉州东坡",
    address: "东三环北路甲19号",
    lat: 39.990154,
    lng: 116.459789,
    distance: 380,
    type: "中餐|川菜",
    phone: "010-84567898",
  },
  {
    id: "mock_poi_010",
    name: "南京大牌档",
    address: "凤凰城商场4层",
    lat: 39.989054,
    lng: 116.457989,
    distance: 220,
    type: "中餐|江苏菜",
    phone: "010-84567899",
  },
  {
    id: "mock_poi_011",
    name: "南锣肥猫",
    address: "曙光西里甲5号3层",
    lat: 39.989654,
    lng: 116.458589,
    distance: 290,
    type: "中餐|烤鱼",
    phone: "010-84567900",
  },
  {
    id: "mock_poi_012",
    name: "旺顺阁",
    address: "三元桥南银大厦3层",
    lat: 39.986854,
    lng: 116.454589,
    distance: 350,
    type: "中餐|鱼头泡饼",
    phone: "010-84567901",
  },
  {
    id: "mock_poi_013",
    name: "船歌鱼水饺",
    address: "凤凰城商场B2层",
    lat: 39.986954,
    lng: 116.455689,
    distance: 95,
    type: "中餐|海鲜",
    phone: "010-84567902",
  },
  {
    id: "mock_poi_014",
    name: "海底捞火锅",
    address: "曙光西里甲5号B1层",
    lat: 39.989854,
    lng: 116.458889,
    distance: 450,
    type: "火锅|川渝火锅",
    phone: "010-84567903",
  },
  {
    id: "mock_poi_015",
    name: "外婆家",
    address: "凤凰城商场5层",
    lat: 39.989454,
    lng: 116.458189,
    distance: 280,
    type: "中餐|杭帮菜",
    phone: "010-84567904",
  },
  {
    id: "mock_poi_016",
    name: "雕爷牛腩",
    address: "三元桥南银大厦5层",
    lat: 39.987054,
    lng: 116.454989,
    distance: 480,
    type: "中餐|私房菜",
    phone: "010-84567906",
  },
  {
    id: "mock_poi_017",
    name: "满记甜品",
    address: "凤凰城商场B1层",
    lat: 39.987454,
    lng: 116.456289,
    distance: 110,
    type: "甜品|港式甜品",
    phone: "010-84567907",
  },
  {
    id: "mock_poi_018",
    name: "DQ冰雪皇后",
    address: "凤凰城商场1层",
    lat: 39.987854,
    lng: 116.456689,
    distance: 60,
    type: "甜品|冰淇淋",
    phone: "010-84567908",
  },
  {
    id: "mock_poi_019",
    name: "哈根达斯",
    address: "凤凰城商场2层",
    lat: 39.988154,
    lng: 116.457089,
    distance: 130,
    type: "甜品|冰淇淋",
    phone: "010-84567909",
  },
  {
    id: "mock_poi_020",
    name: "太平洋咖啡",
    address: "三元桥南银大厦1层",
    lat: 39.986454,
    lng: 116.454189,
    distance: 520,
    type: "咖啡|咖啡厅",
    phone: "010-84567910",
  },
];

/**
 * 获取 Mock 地址解析结果
 */
export function getMockGeocodeResult(address: string): MockGeocodeResult {
  return {
    formattedAddress: MOCK_ADDRESSES[0],
    province: "北京市",
    city: "北京市",
    district: "朝阳区",
    lat: MOCK_BASE_LOCATION.lat,
    lng: MOCK_BASE_LOCATION.lng,
  };
}

/**
 * 获取 Mock 周边搜索结果
 */
export function getMockPoiResults(
  lat: number,
  lng: number,
  radius: number = 500
): MockPoiResult[] {
  return MOCK_RESTAURANTS.filter((r) => r.distance <= radius);
}

/**
 * 检查是否启用 Mock 模式
 */
export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "1";
}
