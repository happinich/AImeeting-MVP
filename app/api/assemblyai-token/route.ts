// app/api/assemblyai-token/route.ts
// 서버에서만 실행되는 Route Handler — API 키를 클라이언트에 노출하지 않고
// AssemblyAI Streaming(v3)용 임시 토큰을 발급해 반환합니다.

import { AssemblyAI } from "assemblyai";

export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ASSEMBLYAI_API_KEY가 환경변수에 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const client = new AssemblyAI({ apiKey });
    // StreamingTranscriberFactory의 createTemporaryToken을 통해 v3 토큰 발급
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: 480,
    });
    return Response.json({ token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { error: `토큰 발급 실패: ${msg}` },
      { status: 500 }
    );
  }
}
