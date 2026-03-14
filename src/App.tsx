import React, { useState, useEffect } from 'react';
import {
  contentGoals,
  businessTypes,
  mainContentGroups,
  detailedNiches,
  deploymentStyles,
  conversionModels,
  videoStyles,
  platforms,
  languages,
  advancedRequirements,
  outputFormats
} from './data';
import { SelectDropdown } from './components/SelectDropdown';
import { MultiSelectDropdown } from './components/MultiSelectDropdown';
import { generateScript, generateImages, generateVideo, extractPrompts, suggestDetailedNiches, ScriptParams } from './services/gemini';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Loader2, Copy, Check, Sparkles, Image as ImageIcon, Video, FileText, KeyRound } from 'lucide-react';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'script' | 'image' | 'video'>('script');
  const [hasApiKey, setHasApiKey] = useState(false);

  const [params, setParams] = useState<ScriptParams>({
    scriptIdea: "",
    sceneCount: 6,
    contentGoal: contentGoals[0],
    businessType: businessTypes[0],
    mainContentGroup: mainContentGroups[0],
    detailedNiche: detailedNiches["BÁN SẢN PHẨM"] ? detailedNiches["BÁN SẢN PHẨM"][0] : "",
    deploymentStyle: deploymentStyles[0],
    conversionModel: conversionModels[0],
    videoStyle: videoStyles[0],
    platform: platforms[0],
    language: languages[0],
    advancedRequirements: [],
    outputFormat: outputFormats[0],
    additionalContext: ""
  });

  const [dynamicNiches, setDynamicNiches] = useState<string[]>([]);
  const [isGeneratingNiches, setIsGeneratingNiches] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Image State
  const [imagePrompts, setImagePrompts] = useState<string[]>(Array(6).fill(""));
  const [imageAspectRatio, setImageAspectRatio] = useState("16:9");
  const [generatedImages, setGeneratedImages] = useState<string[][]>(Array(6).fill([]));
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean[]>(Array(6).fill(false));

  // Video State
  const [videoPrompts, setVideoPrompts] = useState<string[]>(Array(6).fill(""));
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [useGeneratedImage, setUseGeneratedImage] = useState<boolean[]>(Array(6).fill(true));
  const [generatedVideos, setGeneratedVideos] = useState<(string | null)[]>(Array(6).fill(null));
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean[]>(Array(6).fill(false));
  const [videoProgress, setVideoProgress] = useState<string[]>(Array(6).fill(""));
  const [selectedImageIndex, setSelectedImageIndex] = useState<number[]>(Array(6).fill(0));

  useEffect(() => {
    const count = params.sceneCount;
    setImagePrompts(prev => Array.from({ length: count }, (_, i) => prev[i] || ""));
    setGeneratedImages(prev => Array.from({ length: count }, (_, i) => prev[i] || []));
    setIsGeneratingImage(prev => Array.from({ length: count }, (_, i) => prev[i] || false));
    
    setVideoPrompts(prev => Array.from({ length: count }, (_, i) => prev[i] || ""));
    setUseGeneratedImage(prev => Array.from({ length: count }, (_, i) => prev[i] !== undefined ? prev[i] : true));
    setGeneratedVideos(prev => Array.from({ length: count }, (_, i) => prev[i] || null));
    setIsGeneratingVideo(prev => Array.from({ length: count }, (_, i) => prev[i] || false));
    setVideoProgress(prev => Array.from({ length: count }, (_, i) => prev[i] || ""));
    setSelectedImageIndex(prev => Array.from({ length: count }, (_, i) => prev[i] || 0));
  }, [params.sceneCount]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // Update detailed niche when main content group changes
  useEffect(() => {
    setDynamicNiches([]); // Reset dynamic niches
    // Map main content group to the keys in detailedNiches
    let key = "";
    if (params.mainContentGroup.includes("bán hàng") || params.mainContentGroup.includes("giới thiệu sản phẩm")) {
      key = "BÁN SẢN PHẨM";
    } else if (params.mainContentGroup.includes("dịch vụ")) {
      key = "BÁN DỊCH VỤ";
    } else if (params.mainContentGroup.includes("cho thuê")) {
      key = "CHO THUÊ";
    } else if (params.mainContentGroup.includes("xây niềm tin") || params.mainContentGroup.includes("thương hiệu")) {
      key = "XÂY NIỀM TIN & THƯƠNG HIỆU";
    } else if (params.mainContentGroup.includes("nỗi đau")) {
      key = "GIẢI QUYẾT NỖI ĐAU KHÁCH HÀNG";
    } else if (params.mainContentGroup.includes("review") || params.mainContentGroup.includes("so sánh")) {
      key = "REVIEW / FEEDBACK / CASE STUDY";
    } else if (params.mainContentGroup.includes("podcast")) {
      key = "PODCAST";
    }

    if (key && detailedNiches[key]) {
      setParams(prev => ({ ...prev, detailedNiche: detailedNiches[key][0] }));
    }
  }, [params.mainContentGroup]);

  const handleSingleSelect = (field: keyof ScriptParams, value: string | number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: keyof ScriptParams, value: string) => {
    setParams(prev => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const currentNicheKey = () => {
    if (params.mainContentGroup.includes("bán hàng") || params.mainContentGroup.includes("giới thiệu sản phẩm")) return "BÁN SẢN PHẨM";
    if (params.mainContentGroup.includes("dịch vụ")) return "BÁN DỊCH VỤ";
    if (params.mainContentGroup.includes("cho thuê")) return "CHO THUÊ";
    if (params.mainContentGroup.includes("xây niềm tin") || params.mainContentGroup.includes("thương hiệu")) return "XÂY NIỀM TIN & THƯƠNG HIỆU";
    if (params.mainContentGroup.includes("nỗi đau")) return "GIẢI QUYẾT NỖI ĐAU KHÁCH HÀNG";
    if (params.mainContentGroup.includes("review") || params.mainContentGroup.includes("so sánh")) return "REVIEW / FEEDBACK / CASE STUDY";
    if (params.mainContentGroup.includes("podcast")) return "PODCAST";
    return "BÁN SẢN PHẨM"; // fallback
  };

  const handleSuggestNiches = async () => {
    setIsGeneratingNiches(true);
    try {
      const niches = await suggestDetailedNiches({
        scriptIdea: params.scriptIdea,
        sceneCount: params.sceneCount,
        contentGoal: params.contentGoal,
        businessType: params.businessType,
        mainContentGroup: params.mainContentGroup
      });
      if (niches.length > 0) {
        setDynamicNiches(niches);
        setParams(prev => ({ ...prev, detailedNiche: niches[0] }));
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo gợi ý ngách nội dung. Vui lòng thử lại.");
    } finally {
      setIsGeneratingNiches(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    
    // Scroll to result panel on mobile
    if (window.innerWidth < 768) {
      document.getElementById('result-panel')?.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const script = await generateScript(params);
      setResult(script);
    } catch (error) {
      alert("Lỗi khi tạo kịch bản. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtractPrompts = async () => {
    if (!result) return;
    setIsExtracting(true);
    try {
      const { imagePrompts: newImagePrompts, videoPrompts: newVideoPrompts } = await extractPrompts(result, params.sceneCount);
      setImagePrompts(newImagePrompts);
      setVideoPrompts(newVideoPrompts);
      alert("Đã trích xuất prompt thành công!");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi trích xuất prompt. Vui lòng thử lại.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateImage = async (index: number) => {
    const prompt = imagePrompts[index];
    if (!prompt) return;
    
    const newIsGenerating = [...isGeneratingImage];
    newIsGenerating[index] = true;
    setIsGeneratingImage(newIsGenerating);
    
    try {
      const base64Array = await generateImages(prompt, imageAspectRatio, 4);
      const newImages = [...generatedImages];
      newImages[index] = base64Array;
      setGeneratedImages(newImages);
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi tạo ảnh.");
    } finally {
      const newIsGenerating = [...isGeneratingImage];
      newIsGenerating[index] = false;
      setIsGeneratingImage(newIsGenerating);
    }
  };

  const handleGenerateVideo = async (index: number) => {
    if (!hasApiKey) {
      alert("Vui lòng chọn API Key để tạo video.");
      return;
    }
    const prompt = videoPrompts[index];
    if (!prompt) return;
    
    const newIsGenerating = [...isGeneratingVideo];
    newIsGenerating[index] = true;
    setIsGeneratingVideo(newIsGenerating);
    
    const newProgress = [...videoProgress];
    newProgress[index] = "Đang bắt đầu...";
    setVideoProgress(newProgress);
    
    try {
      const selectedImgIdx = selectedImageIndex[index];
      const imageBase64 = (useGeneratedImage[index] && generatedImages[index]?.[selectedImgIdx]) ? generatedImages[index][selectedImgIdx] : undefined;
      
      const videoUrl = await generateVideo(prompt, imageBase64, videoAspectRatio, (msg) => {
        setVideoProgress(prev => {
          const updated = [...prev];
          updated[index] = msg;
          return updated;
        });
      });
      
      const newVideos = [...generatedVideos];
      newVideos[index] = videoUrl;
      setGeneratedVideos(newVideos);
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi tạo video.");
    } finally {
      setIsGeneratingVideo(prev => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
      setVideoProgress(prev => {
        const updated = [...prev];
        updated[index] = "";
        return updated;
      });
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Left Panel: Configuration Form */}
      <div className="w-full md:w-1/2 lg:w-5/12 md:h-screen md:overflow-y-auto border-r border-gray-200 bg-white p-6 md:p-8 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Muzi Content
          </h1>
          
          <div className="flex space-x-2 mt-6 border-b border-gray-200 pb-0">
            <button 
              onClick={() => setActiveTab('script')} 
              className={`px-4 py-3 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'script' ? 'bg-indigo-50 text-indigo-700 font-semibold border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <FileText className="w-4 h-4" />
              Kịch bản
            </button>
            <button 
              onClick={() => setActiveTab('image')} 
              className={`px-4 py-3 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'image' ? 'bg-indigo-50 text-indigo-700 font-semibold border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ImageIcon className="w-4 h-4" />
              Tạo Ảnh
            </button>
            <button 
              onClick={() => setActiveTab('video')} 
              className={`px-4 py-3 rounded-t-lg flex items-center gap-2 transition-colors ${activeTab === 'video' ? 'bg-indigo-50 text-indigo-700 font-semibold border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Video className="w-4 h-4" />
              Tạo Video
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'script' && (
            <div className="space-y-8 pb-8">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Ý tưởng kịch bản nội dung</h3>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
                  placeholder="VD: Một ngày du hí hết Sài Gòn..."
                  value={params.scriptIdea}
                  onChange={(e) => handleSingleSelect('scriptIdea', e.target.value)}
                />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Số lượng Phân cảnh (Scene)</h3>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={params.sceneCount}
                  onChange={(e) => handleSingleSelect('sceneCount', parseInt(e.target.value) || 6)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                />
              </div>

              <SelectDropdown
                label="1. Mục tiêu nội dung"
                options={contentGoals}
                selected={params.contentGoal}
                onChange={(val) => handleSingleSelect('contentGoal', val)}
              />

              <SelectDropdown
                label="2. Loại hình kinh doanh"
                options={businessTypes}
                selected={params.businessType}
                onChange={(val) => handleSingleSelect('businessType', val)}
              />

              <SelectDropdown
                label="3. Nhóm nội dung chính"
                options={mainContentGroups}
                selected={params.mainContentGroup}
                onChange={(val) => handleSingleSelect('mainContentGroup', val)}
              />

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    4. Ngách nội dung chi tiết
                  </h3>
                  <button
                    onClick={handleSuggestNiches}
                    disabled={isGeneratingNiches}
                    className="text-xs flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isGeneratingNiches ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Tạo 20 ngách bằng AI
                  </button>
                </div>
                <select
                  value={params.detailedNiche}
                  onChange={(e) => handleSingleSelect('detailedNiche', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                >
                  {(dynamicNiches.length > 0 ? dynamicNiches : (detailedNiches[currentNicheKey()] || [])).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <SelectDropdown
                label="5. Kiểu triển khai nội dung"
                options={deploymentStyles}
                selected={params.deploymentStyle}
                onChange={(val) => handleSingleSelect('deploymentStyle', val)}
              />

              <SelectDropdown
                label="6. Mẫu chuyển đổi"
                options={conversionModels}
                selected={params.conversionModel}
                onChange={(val) => handleSingleSelect('conversionModel', val)}
              />

              <SelectDropdown
                label="7. Phong cách video"
                options={videoStyles}
                selected={params.videoStyle}
                onChange={(val) => handleSingleSelect('videoStyle', val)}
              />

              <SelectDropdown
                label="8. Nền tảng xuất nội dung"
                options={platforms}
                selected={params.platform}
                onChange={(val) => handleSingleSelect('platform', val)}
              />

              <SelectDropdown
                label="9. Ngôn ngữ đầu ra"
                options={languages}
                selected={params.language}
                onChange={(val) => handleSingleSelect('language', val)}
              />

              <MultiSelectDropdown
                label="10. Yêu cầu nâng cao"
                options={advancedRequirements}
                selected={params.advancedRequirements}
                onChange={(val) => handleMultiSelect('advancedRequirements', val)}
              />

              <SelectDropdown
                label="11. Đầu ra mong muốn"
                options={outputFormats}
                selected={params.outputFormat}
                onChange={(val) => handleSingleSelect('outputFormat', val)}
              />

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Thông tin bổ sung (Tùy chọn)</h3>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  rows={4}
                  placeholder="Nhập thêm thông tin về sản phẩm, dịch vụ, hoặc ý tưởng cụ thể của bạn..."
                  value={params.additionalContext}
                  onChange={(e) => handleSingleSelect('additionalContext', e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang tạo kịch bản...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Tạo Kịch Bản Ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex-1 mr-4">
                  <p className="text-sm text-blue-800">
                    <strong>Mẹo đồng nhất nhân vật:</strong> Hãy mô tả thật chi tiết về ngoại hình, trang phục, kiểu tóc của nhân vật trong prompt. Ảnh tạo ra ở đây có thể được dùng làm khung hình gốc cho Video.
                  </p>
                </div>
                <button
                  onClick={handleExtractPrompts}
                  disabled={!result || isExtracting}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tự động trích xuất prompt từ kịch bản đã tạo"
                >
                  {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Trích xuất từ Kịch bản
                </button>
              </div>

              <SelectDropdown
                label="Tỷ lệ khung hình"
                options={["16:9", "9:16", "1:1", "4:3", "3:4"]}
                selected={imageAspectRatio}
                onChange={(val) => setImageAspectRatio(val as string)}
              />

              <div className="space-y-6 mt-6">
                {imagePrompts.map((prompt, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Phân cảnh {index + 1}</h3>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none mb-3"
                      placeholder={`Mô tả hình ảnh cho phân cảnh ${index + 1}...`}
                      value={prompt}
                      onChange={(e) => {
                        const newPrompts = [...imagePrompts];
                        newPrompts[index] = e.target.value;
                        setImagePrompts(newPrompts);
                      }}
                    />
                    <button
                      onClick={() => handleGenerateImage(index)}
                      disabled={isGeneratingImage[index] || !prompt}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200"
                    >
                      {isGeneratingImage[index] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang tạo 4 ảnh...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          Tạo 4 Ảnh (Nano Banana)
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-6 pb-8">
              {!hasApiKey && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 flex flex-col items-start gap-3">
                  <p className="text-sm text-amber-800">
                    Bạn cần chọn API Key (có hỗ trợ Veo) để sử dụng tính năng tạo Video.
                  </p>
                  <button 
                    onClick={handleSelectApiKey}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    Chọn API Key
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex-1 mr-4">
                  <p className="text-sm text-indigo-800">
                    <strong>Đồng nhất nhân vật:</strong> Sử dụng ảnh bạn vừa tạo ở tab "Tạo Ảnh" làm khung hình đầu tiên để AI tạo video dựa trên nhân vật đó.
                  </p>
                </div>
                <button
                  onClick={handleExtractPrompts}
                  disabled={!result || isExtracting}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tự động trích xuất prompt từ kịch bản đã tạo"
                >
                  {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Trích xuất từ Kịch bản
                </button>
              </div>

              <SelectDropdown
                label="Tỷ lệ khung hình"
                options={["16:9", "9:16"]}
                selected={videoAspectRatio}
                onChange={(val) => setVideoAspectRatio(val as string)}
              />

              <div className="space-y-6 mt-6">
                {videoPrompts.map((prompt, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Phân cảnh {index + 1}</h3>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none mb-3"
                      placeholder={`Mô tả hành động video cho phân cảnh ${index + 1}...`}
                      value={prompt}
                      onChange={(e) => {
                        const newPrompts = [...videoPrompts];
                        newPrompts[index] = e.target.value;
                        setVideoPrompts(newPrompts);
                      }}
                    />

                    {generatedImages[index]?.length > 0 && (
                      <div className="mb-4 p-3 border border-gray-100 rounded-lg bg-gray-50">
                        <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer mb-2">
                          <input 
                            type="checkbox" 
                            checked={useGeneratedImage[index]}
                            onChange={(e) => {
                              const newUse = [...useGeneratedImage];
                              newUse[index] = e.target.checked;
                              setUseGeneratedImage(newUse);
                            }}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          Sử dụng ảnh đã tạo làm khung hình gốc
                        </label>
                        {useGeneratedImage[index] && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {generatedImages[index].map((img, imgIdx) => (
                              <img 
                                key={imgIdx}
                                src={`data:image/jpeg;base64,${img}`} 
                                alt={`Scene ${index + 1} Image ${imgIdx + 1}`}
                                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all ${selectedImageIndex[index] === imgIdx ? 'border-indigo-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                onClick={() => {
                                  const newSelected = [...selectedImageIndex];
                                  newSelected[index] = imgIdx;
                                  setSelectedImageIndex(newSelected);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleGenerateVideo(index)}
                      disabled={isGeneratingVideo[index] || !prompt || !hasApiKey}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200"
                    >
                      {isGeneratingVideo[index] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang tạo video...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          Tạo Video
                        </>
                      )}
                    </button>
                    {videoProgress[index] && (
                      <p className="text-xs text-center text-indigo-600 mt-2 font-medium animate-pulse">{videoProgress[index]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="w-full md:w-1/2 lg:w-7/12 min-h-[50vh] md:h-screen md:overflow-y-auto bg-gray-50 p-6 md:p-8 flex flex-col" id="result-panel">
        {activeTab === 'script' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Kết quả Kịch bản
              </h2>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã copy' : 'Copy'}
                </button>
              )}
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p>AI đang sáng tạo kịch bản cho bạn...</p>
                </div>
              ) : result ? (
                <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
                  <div className="markdown-body">
                    <Markdown rehypePlugins={[rehypeRaw]}>{result}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Sparkles className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-center max-w-sm">
                    Hoàn thành cấu hình bên trái và bấm "Tạo Kịch Bản Ngay" để xem kết quả tại đây.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                Kết quả Hình ảnh
              </h2>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-gray-100/50">
              {generatedImages.some(imgs => imgs.length > 0) || isGeneratingImage.some(Boolean) ? (
                <div className="space-y-8">
                  {imagePrompts.map((_, index) => {
                    const images = generatedImages[index];
                    const isGenerating = isGeneratingImage[index];
                    
                    if (!isGenerating && (!images || images.length === 0)) return null;

                    return (
                      <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">Phân cảnh {index + 1}</h3>
                        {isGenerating ? (
                          <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                            <p>Đang tạo 4 ảnh...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {images.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-gray-200">
                                <img 
                                  src={`data:image/jpeg;base64,${img}`} 
                                  alt={`Scene ${index + 1} Image ${imgIdx + 1}`} 
                                  className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <a 
                                    href={`data:image/jpeg;base64,${img}`} 
                                    download={`scene-${index+1}-image-${imgIdx+1}.jpg`}
                                    className="bg-white text-gray-800 hover:bg-gray-50 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm"
                                  >
                                    Tải xuống
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-center max-w-sm">
                    Nhập mô tả ảnh cho từng phân cảnh và bấm "Tạo 4 Ảnh" để xem kết quả.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-500" />
                Kết quả Video
              </h2>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-gray-100/50">
              {generatedVideos.some(Boolean) || isGeneratingVideo.some(Boolean) ? (
                <div className="space-y-8">
                  {videoPrompts.map((_, index) => {
                    const video = generatedVideos[index];
                    const isGenerating = isGeneratingVideo[index];
                    const progress = videoProgress[index];
                    
                    if (!isGenerating && !video) return null;

                    return (
                      <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">Phân cảnh {index + 1}</h3>
                        {isGenerating ? (
                          <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                            <p className="text-center max-w-xs">{progress || "Đang tạo video..."}</p>
                          </div>
                        ) : video ? (
                          <div className="relative group rounded-lg overflow-hidden border border-gray-200">
                            <video 
                              src={video} 
                              controls 
                              loop
                              className="w-full h-auto bg-black"
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a 
                                href={video} 
                                download={`scene-${index+1}-video.mp4`}
                                className="bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm"
                              >
                                Tải xuống
                              </a>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Video className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-center max-w-sm">
                    Nhập mô tả hành động cho từng phân cảnh và bấm "Tạo Video" để xem kết quả.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
