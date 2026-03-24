import { NextRequest, NextResponse } from "next/server";
import { geocode, type GeocodeResult } from "@/lib/amap-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    // 参数验证
    if (!address || typeof address !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "地址参数缺失或格式错误",
        },
        { status: 400 }
      );
    }

    if (address.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "地址不能为空",
        },
        { status: 400 }
      );
    }

    // 调用高德地图地址解析
    const result: GeocodeResult = await geocode(address.trim());

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Geocode API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "地址解析失败";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
