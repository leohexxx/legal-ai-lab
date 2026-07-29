"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConsentItem = {
  id: string;
  label: string;
  detail: string;
};

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: "understand_ai_role",
    label: "了解 AI 的角色",
    detail: "本产品提供法律信息检索和流程辅助，AI 不替代执业律师。系统生成的内容不构成正式法律意见。",
  },
  {
    id: "understand_data_use",
    label: "了解数据用途",
    detail: "您描述的案件事实仅用于生成分析结果，不会用于模型训练。详细说明见隐私政策。",
  },
  {
    id: "understand_scope",
    label: "了解服务范围",
    detail: "当前深度支持劳动争议（欠薪）场景。其他法律问题将引导您整理基本材料，部分功能可能受限。",
  },
  {
    id: "agree_collection",
    label: "同意信息采集",
    detail: "系统将采集案件所需的最小必要信息（包括主体信息、工资约定、证据材料等），您可以随时查看、导出和删除。",
  },
  {
    id: "understand_risk",
    label: "了解风险提示",
    detail: "紧急情况（涉及人身安全、群体性事件、临近法定期限）不应依赖本产品，请立即咨询执业律师或拨打 12348。",
  },
  {
    id: "agree_share",
    label: "同意文件处理",
    detail: "上传文件前请遮盖无关敏感信息（如身份证号、银行卡号等）。文件仅用于案件分析，不会自动分享给第三方。",
  },
];

export default function U02Page() {
  const router = useRouter();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const allAgreed = CONSENT_ITEMS.every((item) => consents[item.id]);
  const someAgreed = Object.keys(consents).length > 0;

  const toggleConsent = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleProceed = () => {
    router.push("/u03");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶部 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">
            ← 返回
          </button>
          <span className="text-sm font-medium text-gray-900">服务边界与隐私同意</span>
        </div>
      </div>

      {/* 主内容 */}
      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">在使用之前，请先了解以下几点</h1>
          <p className="text-sm text-gray-500">
            法律问题可能涉及重要权益，请您在开始前确认理解以下内容。
          </p>
        </div>

        {/* 同意项列表 */}
        <div className="space-y-3 mb-8">
          {CONSENT_ITEMS.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={!!consents[item.id]}
                  onChange={() => toggleConsent(item.id)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDetail(showDetail === item.id ? null : item.id);
                      }}
                      className="text-xs text-primary hover:text-[#3C3489] flex-shrink-0 ml-2"
                    >
                      {showDetail === item.id ? "收起" : "详情"}
                    </button>
                  </div>
                  {showDetail === item.id && (
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
                      {item.detail}
                    </p>
                  )}
                </div>
              </label>

              {/* 在底部显示详情（手机友好） */}
            </div>
          ))}
        </div>

        {/* 额外说明 */}
        <div className="bg-amber-50 rounded-xl px-4 py-3 mb-8">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>隐私说明：</strong>您的案件数据仅存储在您的账户下，不会用于 AI 模型训练。
            您可以随时在"数据与授权"中查看已收集的信息、导出或删除。数据保留期为案件结束后 90 天，
            法定需要延长保留的情况将另行通知。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleProceed}
            disabled={!allAgreed}
            className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            {allAgreed ? "已理解并同意，开始使用 →" : someAgreed ? "请同意全部条款后继续" : "请阅读并同意以上内容"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl border border-gray-200 text-gray-500 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            暂不使用，退出
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
          同意版本：v1.0（2026-07-27）&nbsp;·&nbsp;
          <button className="hover:text-primary">查看完整隐私政策</button>
        </p>
      </main>
    </div>
  );
}
