import { GoogleGenAI } from "@google/genai";

function getAI(customApiKey?: string) {
  const key = customApiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Vui lòng cung cấp API Key để sử dụng tính năng này.");
  }
  return new GoogleGenAI({ apiKey: key });
}

function handleGeminiError(error: any, defaultMessage: string): never {
  console.error(defaultMessage, error);
  const errorMessage = error?.message?.toLowerCase() || "";
  if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("resource_exhausted")) {
    throw new Error("Hệ thống đang quá tải (vượt quá giới hạn API miễn phí). Vui lòng đợi 1-2 phút rồi thử lại nhé!");
  }
  throw new Error(defaultMessage);
}

export interface ScriptParams {
  scriptIdea: string;
  sceneCount: number;
  contentGoal: string;
  businessType: string;
  mainContentGroup: string;
  detailedNiche: string;
  deploymentStyle: string;
  conversionModel: string;
  videoStyle: string;
  platform: string;
  language: string;
  advancedRequirements: string[];
  outputFormat: string;
  additionalContext: string;
}

export async function generateScript(params: ScriptParams, customApiKey?: string): Promise<string> {
  const prompt = `
Bạn là một chuyên gia sáng tạo nội dung, đạo diễn video và copywriter hàng đầu.
Hãy tạo một ${params.outputFormat} dựa trên các thông tin sau:

0. Ý tưởng kịch bản chủ đạo: ${params.scriptIdea || "Không có, hãy tự đề xuất một ý tưởng sáng tạo"}
1. Số lượng phân cảnh (Scene): BẮT BUỘC PHẢI CÓ ĐÚNG ${params.sceneCount} PHÂN CẢNH.
2. Mục tiêu nội dung: ${params.contentGoal}
3. Loại hình kinh doanh: ${params.businessType}
4. Nhóm nội dung chính: ${params.mainContentGroup}
5. Ngách nội dung chi tiết: ${params.detailedNiche}
6. Kiểu triển khai nội dung: ${params.deploymentStyle}
7. Mẫu chuyển đổi: ${params.conversionModel}
8. Phong cách video: ${params.videoStyle}
9. Nền tảng xuất nội dung: ${params.platform}
10. Ngôn ngữ đầu ra: ${params.language}
11. Yêu cầu nâng cao: ${params.advancedRequirements.join(", ")}
12. Đầu ra mong muốn: ${params.outputFormat}

Thông tin bổ sung từ người dùng:
${params.additionalContext || "Không có"}

YÊU CẦU QUAN TRỌNG VỀ ĐỊNH DẠNG VÀ NỘI DUNG (BẮT BUỘC TUÂN THỦ):
- Kịch bản, bối cảnh, nhân vật, văn phong BẮT BUỘC phải mang đậm nét văn hóa, con người và bối cảnh Việt Nam (vì đối tượng khách hàng tiếp nhận là người Việt Nam).
- Viết nội dung chất lượng cao, đúng định dạng yêu cầu.
- BẮT BUỘC PHẢI VIẾT ĐÚNG ${params.sceneCount} PHÂN CẢNH (SCENE). TUYỆT ĐỐI KHÔNG ĐƯỢC VIẾT THIẾU SỐ LƯỢNG NÀY.
- Nếu là kịch bản video, KHÔNG DÙNG BẢNG (TABLE). Hãy trình bày kịch bản theo định dạng văn bản chuẩn như ví dụ dưới đây:

Ví dụ định dạng chuẩn:
KỊCH BẢN VIDEO (THỜI LƯỢNG: ~XX GIÂY)

00:00 - 00:04 | Cận cảnh (Macro shot) đôi đũa gắp miếng măng vàng óng, dính tỏi băm và ớt đỏ rực lên từ bát mì tôm đang bốc khói. Măng nhìn cực kỳ giòn và mọng nước. 
[Âm thanh] Tiếng "Rộp rộp" nhai măng cực giòn (ASMR).
[Giọng nữ kể chuyện - Kiểu Podcast mộc mạc]: "Chị nói thật, ăn bát phở hay úp gói mì mà thiếu cái hũ măng này..." 
- 3 giây đầu phải khóa chân người xem bằng hình ảnh cực kỳ "ngon mắt" và tiếng nhai ASMR. Text trên màn hình: "Ăn mì mà thiếu cái này thì..." 

00:04 - 00:12 | Góc máy Podcast/Vlog: Một bạn nữ ngồi ở bàn ăn gia đình (có lấp ló chiếc mic thu âm trên bàn), tay vừa mở nắp hũ măng tỏi ớt, khói chua cay như bốc lên. Biểu cảm xuýt xoa.  
[Giọng nữ kể chuyện]: "...là coi như mất đi 50% linh hồn của bữa ăn rồi em ạ. Lúc thấy shop em quảng cáo, chị mua thử 1 hũ thôi vì sợ măng bị hăng..." 
- Text màn hình: "Góc review chân thật từ bà chị khó tính". Duy trì nhịp độ kể chuyện tự nhiên, giống như đang tâm sự. 

(Tiếp tục trình bày theo format trên cho đến khi đủ ${params.sceneCount} phân cảnh)
`;

  try {
    const ai = getAI(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Không thể tạo nội dung. Vui lòng thử lại.";
  } catch (error) {
    handleGeminiError(error, "Đã xảy ra lỗi khi gọi Gemini API.");
  }
}

export async function suggestDetailedNiches(params: {
  scriptIdea: string;
  sceneCount: number;
  contentGoal: string;
  businessType: string;
  mainContentGroup: string;
}, customApiKey?: string): Promise<string[]> {
  const prompt = `
Bạn là một chuyên gia sáng tạo nội dung và chiến lược gia marketing.
Dựa vào các thông tin sau:
- Ý tưởng kịch bản nội dung: ${params.scriptIdea || "Không có"}
- Số lượng Phân cảnh (Scene): ${params.sceneCount}
- Mục tiêu nội dung: ${params.contentGoal}
- Loại hình kinh doanh: ${params.businessType}
- Nhóm nội dung chính: ${params.mainContentGroup}

Hãy tạo ra danh sách đúng 20 ngách nội dung chi tiết (detailed niches) cực kỳ phù hợp, sáng tạo và thực tế để người dùng có thể chọn làm chủ đề cho video của họ.
Các ngách này phải cụ thể, ví dụ thay vì "Thời trang", hãy viết "Thời trang công sở nữ mùa hè", "Phối đồ đi chơi cho nam gầy", v.v.

Trả về kết quả dưới dạng JSON array chứa các chuỗi (string). Chỉ trả về JSON hợp lệ, không kèm theo bất kỳ văn bản nào khác.
Ví dụ:
[
  "Ngách 1",
  "Ngách 2"
]
`;

  try {
    const ai = getAI(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    const data = JSON.parse(text);
    
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [];
  } catch (error) {
    handleGeminiError(error, "Đã xảy ra lỗi khi tạo gợi ý ngách nội dung.");
  }
}

export async function extractPrompts(script: string, sceneCount: number, customApiKey?: string): Promise<{ imagePrompts: string[], videoPrompts: string[] }> {
  const prompt = `
Bạn là một chuyên gia phân tích kịch bản. Tôi có một kịch bản gồm ${sceneCount} phân cảnh.
Nhiệm vụ của bạn là trích xuất mô tả hình ảnh (Image Prompt) và mô tả hành động video (Video Prompt) cho TỪNG phân cảnh.

KỊCH BẢN:
${script}

YÊU CẦU:
- Phân tích từng phân cảnh và tạo ra 1 Image Prompt và 1 Video Prompt tương ứng.
- Image Prompt: Mô tả CỰC KỲ CHI TIẾT để tạo ra bức ảnh chân thực nhất (photorealistic). BẮT BUỘC phải bao gồm các yếu tố sau:
  + Nhân vật: Độ tuổi, giới tính, biểu cảm, trang phục, hành động.
  + Bối cảnh: Không gian xung quanh, chi tiết nền, thời gian trong ngày.
  + Góc máy: Cận cảnh (close-up), toàn cảnh (wide shot), góc cao, góc thấp...
  + Ánh sáng: Ánh sáng tự nhiên, ánh sáng điện ảnh (cinematic lighting), ánh sáng neon, ngược sáng...
  + Chất lượng ảnh: Thêm các từ khóa như "highly detailed, photorealistic, 8k resolution, masterpiece, cinematic".
- Video Prompt: Mô tả hành động, chuyển động của nhân vật/camera dựa trên Image Prompt.
- BẮT BUỘC: Cả Image Prompt và Video Prompt phải miêu tả rõ nhân vật là người Việt Nam (ví dụ: Vietnamese man, Vietnamese woman, Vietnamese people) và bối cảnh ở Việt Nam (nếu có).
- BẮT BUỘC: Viết prompt bằng tiếng Anh để AI tạo ảnh/video (như Midjourney, Veo) hiểu tốt nhất.
- Trả về kết quả dưới dạng JSON với cấu trúc sau:
{
  "scenes": [
    {
      "imagePrompt": "Mô tả ảnh cho phân cảnh 1...",
      "videoPrompt": "Mô tả video cho phân cảnh 1..."
    },
    ... (lặp lại cho đủ ${sceneCount} phân cảnh)
  ]
}
Chỉ trả về JSON hợp lệ, không kèm theo bất kỳ văn bản nào khác.
`;

  try {
    const ai = getAI(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    const imagePrompts: string[] = [];
    const videoPrompts: string[] = [];
    
    if (data.scenes && Array.isArray(data.scenes)) {
      for (let i = 0; i < sceneCount; i++) {
        const scene = data.scenes[i] || {};
        imagePrompts.push(scene.imagePrompt || "");
        videoPrompts.push(scene.videoPrompt || "");
      }
    } else {
      for (let i = 0; i < sceneCount; i++) {
        imagePrompts.push("");
        videoPrompts.push("");
      }
    }
    
    return { imagePrompts, videoPrompts };
  } catch (error) {
    handleGeminiError(error, "Đã xảy ra lỗi khi trích xuất prompt.");
  }
}

export async function generateImages(prompt: string, aspectRatio: string = "16:9", count: number = 4, customApiKey?: string): Promise<string[]> {
  const imageAi = getAI(customApiKey);

  const promises = Array.from({ length: count }).map(async () => {
    try {
      const response = await imageAi.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data; // base64 string
        }
      }
      return null;
    } catch (error: any) {
      console.error("Error generating image:", error);
      const errorMessage = error?.message?.toLowerCase() || "";
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("resource_exhausted")) {
        throw new Error("Hệ thống đang quá tải (vượt quá giới hạn API miễn phí). Vui lòng đợi 1-2 phút rồi thử lại nhé!");
      }
      return null;
    }
  });

  const results = await Promise.all(promises);
  const validResults = results.filter(Boolean) as string[];
  
  if (validResults.length === 0) {
    throw new Error("Không thể tạo ảnh. Vui lòng thử lại.");
  }
  
  return validResults;
}

export async function generateVideo(prompt: string, imageBase64?: string, aspectRatio: string = "16:9", onProgress?: (msg: string) => void, customApiKey?: string): Promise<string> {
  const videoAi = getAI(customApiKey);
  const apiKey = customApiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;

  try {
    const request: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "A cinematic scene",
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    };

    if (imageBase64) {
      request.image = {
        imageBytes: imageBase64,
        mimeType: 'image/jpeg'
      };
    }

    onProgress?.("Đang khởi tạo quá trình tạo video...");
    let operation = await videoAi.models.generateVideos(request);

    while (!operation.done) {
      onProgress?.("Đang xử lý video... Vui lòng đợi (có thể mất vài phút).");
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await videoAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Không tìm thấy link video");
    }

    onProgress?.("Đang tải video về...");
    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    });
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    const errorMessage = error?.message?.toLowerCase() || "";
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("resource_exhausted")) {
      throw new Error("Hệ thống đang quá tải (vượt quá giới hạn API miễn phí). Vui lòng đợi 1-2 phút rồi thử lại nhé!");
    }
    console.error("Error generating video:", error);
    throw error;
  }
}
