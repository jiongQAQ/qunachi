/**
 * 高德地图 API 客户端
 * 提供地址解析和周边搜索功能
 * 只能在服务端使用，key 通过环境变量访问
 */

export interface GeocodeResult {
  formattedAddress: string;
  province: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
}

export interface PoiSearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  type: string;
  phone?: string;
}

interface AmapGeocodeResponse {
  status: string;
  info?: string;
  geocodes?: Array<{
    province: string;
    city: string;
    district: string;
    location: string;
    formatted_address?: string;
  }>;
}

interface AmapPoiResponse {
  status: string;
  info?: string;
  pois?: Array<{
    id: string;
    name: string;
    address: string;
    location: string;
    distance: string;
    type: string;
    tel?: string;
  }>;
}

/**
 * 检查是否使用 Mock 模式
 * 如果没有配置 AMAP_WEB_SERVICE_KEY，则默认使用 Mock 模式
 */
function isMockMode(): boolean {
  // 如果环境变量显式设置为不使用 mock，则不使用
  if (process.env.USE_MOCKS === "0") {
    return false;
  }
  // 如果没有配置 AMAP Web Service Key，默认使用 mock 模式
  if (!process.env.AMAP_WEB_SERVICE_KEY) {
    return true;
  }
  // 显式启用 mock 模式
  return process.env.USE_MOCKS === "1";
}

/**
 * 获取高德地图 API Key
 */
function getApiKey(): string {
  const key = process.env.AMAP_WEB_SERVICE_KEY;
  if (!key) {
    throw new Error("AMAP_WEB_SERVICE_KEY environment variable is not set");
  }
  return key;
}

/**
 * 解析经纬度字符串 "lng,lat" 为数字
 */
function parseLocation(location: string): { lng: number; lat: number } {
  const [lng, lat] = location.split(",").map(Number);
  return { lng, lat };
}

/**
 * 地址解析 - 将地址字符串转换为坐标
 */
export async function geocode(address: string): Promise<GeocodeResult> {
  if (isMockMode()) {
    return geocodeMock(address);
  }

  const apiKey = getApiKey();
  const url = new URL("https://restapi.amap.com/v3/geocode/geo");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("address", address);
  url.searchParams.set("output", "json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: AmapGeocodeResponse = await response.json();

    if (data.status !== "1" || !data.geocodes || data.geocodes.length === 0) {
      throw new Error(data.info || "地址解析失败");
    }

    const firstResult = data.geocodes[0];
    const { lng, lat } = parseLocation(firstResult.location);

    return {
      formattedAddress: firstResult.formatted_address || address,
      province: firstResult.province,
      city: firstResult.city,
      district: firstResult.district,
      lat,
      lng,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("地址解析请求超时");
    }
    throw error;
  }
}

/**
 * 周边搜索 - 搜索指定坐标附近的餐饮 POI
 */
export async function poiSearch(
  lat: number,
  lng: number,
  radius: number = 500,
  types: string = "050000" // 餐饮类 POI 类型代码
): Promise<PoiSearchResult[]> {
  if (isMockMode()) {
    return poiSearchMock(lat, lng, radius);
  }

  const apiKey = getApiKey();
  const url = new URL("https://restapi.amap.com/v3/place/around");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("location", `${lng},${lat}`);
  url.searchParams.set("types", types);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("offset", "20");
  url.searchParams.set("page", "1");
  url.searchParams.set("output", "json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: AmapPoiResponse = await response.json();

    if (data.status !== "1") {
      throw new Error(data.info || "周边搜索失败");
    }

    if (!data.pois || data.pois.length === 0) {
      return [];
    }

    return data.pois.map((poi) => {
      const { lng: poiLng, lat: poiLat } = parseLocation(poi.location);
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address || "",
        lat: poiLat,
        lng: poiLng,
        distance: Number(poi.distance) || 0,
        type: poi.type || "",
        phone: poi.tel || undefined,
      };
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("周边搜索请求超时");
    }
    throw error;
  }
}

// ============ Mock 数据实现 ============

const MOCK_LOCATION = {
  lng: 116.456789,
  lat: 39.987654,
};

const MOCK_ADDRESSES = [
  "北京市朝阳区三元桥凤凰城商场B1层",
  "北京市朝阳区曙光西里甲5号凤凰城商场",
  "北京市朝阳区东三环北路甲19号",
  "北京市朝阳区三元桥南银大厦",
];

const MOCK_RESTAURANTS = [
  { name: "绿茶餐厅", type: "中餐|江浙菜", address: "凤凰城商场3层", distance: 120, phone: "010-84567890" },
  { name: "鼎泰丰", type: "中餐|小吃", address: "凤凰城商场B1层", distance: 85, phone: "010-84567891" },
  { name: "西贝莜面村", type: "中餐|西北菜", address: "曙光西里甲5号", distance: 200, phone: "010-84567892" },
  { name: "避风塘", type: "中餐|茶餐厅", address: "三元桥南银大厦1层", distance: 310, phone: "010-84567893" },
  { name: "新元素", type: "西餐|轻食", address: "凤凰城商场2层", distance: 150, phone: "010-84567894" },
  { name: "鹿港小镇", type: "中餐|台菜", address: "曙光西里甲5号2层", distance: 250, phone: "010-84567895" },
  { name: "度小月", type: "中餐|台湾菜", address: "凤凰城商场3层", distance: 180, phone: "010-84567896" },
  { name: "旺角亭", type: "中餐|港式餐厅", address: "三元桥南银大厦2层", distance: 420, phone: "010-84567897" },
  { name: "眉州东坡", type: "中餐|川菜", address: "东三环北路甲19号", distance: 380, phone: "010-84567898" },
  { name: "南京大牌档", type: "中餐|江苏菜", address: "凤凰城商场4层", distance: 220, phone: "010-84567899" },
  { name: "南锣肥猫", type: "中餐|烤鱼", address: "曙光西里甲5号3层", distance: 290, phone: "010-84567900" },
  { name: "旺顺阁", type: "中餐|鱼头泡饼", address: "三元桥南银大厦3层", distance: 350, phone: "010-84567901" },
  { name: "船歌鱼水饺", type: "中餐|海鲜", address: "凤凰城商场B2层", distance: 95, phone: "010-84567902" },
  { name: "海底捞火锅", type: "火锅|川渝火锅", address: "曙光西里甲5号B1层", distance: 450, phone: "010-84567903" },
  { name: "外婆家", type: "中餐|杭帮菜", address: "凤凰城商场5层", distance: 280, phone: "010-84567904" },
  { name: "绿茶", type: "中餐|江浙菜", address: "东三环北路甲19号2层", distance: 500, phone: "010-84567905" },
  { name: "雕爷牛腩", type: "中餐|私房菜", address: "三元桥南银大厦5层", distance: 480, phone: "010-84567906" },
  { name: "满记甜品", type: "甜品|港式甜品", address: "凤凰城商场B1层", distance: 110, phone: "010-84567907" },
];

function geocodeMock(address: string): GeocodeResult {
  return {
    formattedAddress: MOCK_ADDRESSES[0],
    province: "北京市",
    city: "北京市",
    district: "朝阳区",
    lat: MOCK_LOCATION.lat,
    lng: MOCK_LOCATION.lng,
  };
}

function poiSearchMock(lat: number, lng: number, radius: number): PoiSearchResult[] {
  // 根据请求的坐标和半径返回模拟数据
  return MOCK_RESTAURANTS
    .filter((r) => r.distance <= radius)
    .map((r, index) => ({
      id: `mock_poi_${index + 1}`,
      name: r.name,
      address: r.address,
      lat: MOCK_LOCATION.lat + (Math.random() - 0.5) * 0.002,
      lng: MOCK_LOCATION.lng + (Math.random() - 0.5) * 0.002,
      distance: r.distance,
      type: r.type,
      phone: r.phone,
    }));
}
