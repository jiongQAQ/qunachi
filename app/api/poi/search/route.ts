import { NextRequest, NextResponse } from "next/server";
import { poiSearch, type PoiSearchResult } from "@/lib/amap-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, radius = 500, types } = body;

    // 参数验证
    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "经纬度参数缺失",
        },
        { status: 400 }
      );
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        {
          success: false,
          error: "经纬度格式错误",
        },
        { status: 400 }
      );
    }

    // 坐标范围校验（中国区域大致范围）
    if (lat < 18 || lat > 54 || lng < 73 || lng > 136) {
      return NextResponse.json(
        {
          success: false,
          error: "坐标超出中国范围",
        },
        { status: 400 }
      );
    }

    // 半径校验（最大5000米）
    if (typeof radius === "number" && (radius < 1 || radius > 5000)) {
      return NextResponse.json(
        {
          success: false,
          error: "搜索半径超出范围(1-5000米)",
        },
        { status: 400 }
      );
    }

    // 调用高德地图周边搜索
    const result: PoiSearchResult[] = await poiSearch(
      lat,
      lng,
      radius,
      types || "050000"
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("POI Search API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "周边搜索失败";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
