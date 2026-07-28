"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore } from "@/lib/store";

// ============================================================
// 类型
// ============================================================

interface ConsentItem {
  id: string;
  name: string;
  granted: boolean;
  date: string;
  version: string;
  description?: string;
}

// ============================================================
// 二次确认弹窗组件
// ============================================================

function ConfirmDialog({
  title,
  message,
  confirmText,
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-xl">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl text-white transition-colors ${
              danger
                ? "bg-[#E24B4A] hover:bg-red-700"
                : "bg-primary hover:bg-[#3C3489]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 模拟同意记录数据
// ============================================================

const MOCK_CONSENT: ConsentItem[] = [
  {
    id: "c01",
    name: "数据收集同意",
    granted: true,
    date: "2026-07-27",
    version: "v1.0",
    description: "同意收集案件相关个人信息和工作信息",
  },
  {
    id: "c02",
    name: "法律分析同意",
    granted: true,
    date: "2026-07-27",
    version: "v1.0",
    description: "同意 AI 系统对案件事实进行法律分析",
  },
  {
    id: "c03",
    name: "律师转交同意",
    granted: true,
    date: "2026-07-27",
    version: "v1.0",
    description: "同意将案件材料转交给合作律师",
  },
  {
    id: "c04",
    name: "数据存储授权",
    granted: true,
    date: "2026-07-27",
    version: "v1.1",
    description: "同意在结案后保留案件数据 90 天",
  },
  {
    id: "c05",
    name: "证据材料处理授权",
    granted: false,
    date: "2026-07-27",
    version: "v1.0",
    description: "同意平台处理上传的证据材料",
  },
  {
    id: "c06",
    name: "数据分析与改进",
    granted: true,
    date: "2026-07-27",
    version: "v1.0",
    description: "同意匿名化数据用于平台改进",
  },
];

// ============================================================
// 主页面
// ============================================================

export default function U15Page() {
  const router = useRouter();
  const caseInfo = useCaseStore((s) => s.caseInfo);

  // Toast 状态
  const [toast, setToast] = useState<string | null>(null);

  // 删除确认弹窗状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    level: "file" | "case" | "account";
  } | null>(null);

  // 删除操作状态
  const [deleteStatus, setDeleteStatus] = useState<{
    requested: string;
    fileDone?: boolean;
    caseDone?: boolean;
    accountDone?: boolean;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleDeleteFile = () => {
    setDeleteConfirm({
      title: "删除所有文件",
      message: "此操作将删除该案件所有上传的文件和附件材料。已确认的事实和报告内容不受影响。此操作不可撤销。",
      level: "file",
    });
  };

  const handleDeleteCase = () => {
    setDeleteConfirm({
      title: "删除案件",
      message: "此操作将删除当前案件的全部数据，包括事实、金额明细、证据、报告等所有信息。此操作不可撤销。",
      level: "case",
    });
  };

  const handleDeleteAccount = () => {
    setDeleteConfirm({
      title: "删除账户",
      message: "此操作将永久删除您的账户及所有关联数据，包括所有历史案件和个人信息。此操作不可撤销。",
      level: "account",
    });
  };

  const executeDelete = () => {
    const now = new Date().toLocaleString("zh-CN");
    setDeleteStatus({
      requested: now,
      fileDone: deleteConfirm?.level === "file" || deleteConfirm?.level === "case" || deleteConfirm?.level === "account",
      caseDone: deleteConfirm?.level === "case" || deleteConfirm?.level === "account",
      accountDone: deleteConfirm?.level === "account",
    });
    setDeleteConfirm(null);
    showToast(
      deleteConfirm?.level === "file"
        ? "文件删除请求已提交"
        : deleteConfirm?.level === "case"
          ? "案件删除请求已提交"
          : "账户删除请求已提交"
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/u06")}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← 案件工作台
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-900">数据与授权</h1>
            <p className="text-xs text-gray-400">
              {caseInfo?.id ?? ""} · 管理隐私、数据和删除操作
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ============ A. 同意记录 ============ */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              A. 同意与授权记录
            </h2>
            <div className="space-y-2">
              {MOCK_CONSENT.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            item.granted ? "bg-[#1D9E75]" : "bg-[#EF9F27]"
                          }`}
                        />
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-300">
                        v{item.version}
                      </span>
                      <span className="text-xs text-gray-400">{item.date}</span>
                      <span
                        className={`text-xs font-medium ${
                          item.granted ? "text-[#1D9E75]" : "text-[#EF9F27]"
                        }`}
                      >
                        {item.granted ? "已授权" : "未授权"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============ B. 数据操作 ============ */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              B. 数据操作
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => showToast("数据下载功能即将上线")}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-left hover:border-gray-300 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">下载个人数据</div>
                <p className="text-xs text-gray-400 mt-1">
                  下载所有与您相关的案件和个人数据（JSON 格式）
                </p>
              </button>
              <button
                onClick={() => showToast("导出功能即将上线")}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-left hover:border-gray-300 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">导出案件包</div>
                <p className="text-xs text-gray-400 mt-1">
                  导出当前案件的完整材料包（含证据和报告）
                </p>
              </button>
            </div>
          </div>

          {/* ============ C. 删除操作 ============ */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              C. 删除操作
            </h2>

            {/* 说明文字 */}
            <div className="rounded-xl bg-amber-50/50 border border-amber-200/50 px-5 py-3 mb-3">
              <p className="text-xs text-amber-700 leading-relaxed">
                删除数据范围和法定保留期限说明：删除操作仅移除当前案件数据。
                根据《劳动争议调解仲裁法》第二十七条，相关数据在案件结束后需保留至少 90 天，
                以满足仲裁时效要求。部分匿名化日志数据可能根据平台隐私政策保留更长时间。
              </p>
            </div>

            {/* 三级删除 */}
            <div className="space-y-2">
              {/* 删除文件 */}
              <div className="rounded-xl border border-[#E24B4A]/20 bg-white px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">删除所有文件</div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      删除案件上传的附件和证据文件，保留事实和报告
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteFile}
                    className="px-4 py-1.5 text-xs font-medium rounded-xl border border-[#E24B4A]/30 text-[#E24B4A] hover:bg-[#E24B4A]/5 transition-colors shrink-0"
                  >
                    删除文件
                  </button>
                </div>
              </div>

              {/* 删除案件 */}
              <div className="rounded-xl border border-[#E24B4A]/20 bg-white px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">删除案件</div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      删除当前案件的全部数据，包括事实、报告等
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteCase}
                    className="px-4 py-1.5 text-xs font-medium rounded-xl border border-[#E24B4A]/30 text-[#E24B4A] hover:bg-[#E24B4A]/5 transition-colors shrink-0"
                  >
                    删除案件
                  </button>
                </div>
              </div>

              {/* 删除账户 */}
              <div className="rounded-xl border border-[#E24B4A]/20 bg-white px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">删除账户</div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      永久删除账户及所有关联数据，包括所有历史案件
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-1.5 text-xs font-medium rounded-xl bg-[#E24B4A] text-white hover:bg-red-700 transition-colors shrink-0"
                  >
                    删除账户
                  </button>
                </div>
              </div>
            </div>

            {/* 删除请求状态 */}
            {deleteStatus && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5">
                <h3 className="text-xs font-semibold text-gray-600 mb-2">最近删除请求</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">请求时间：</span>
                    <span className="text-gray-700">{deleteStatus.requested}</span>
                  </div>
                  {deleteStatus.fileDone && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1D9E75]" />
                      <span className="text-gray-600">文件删除</span>
                      <span className="text-[#1D9E75]">已完成</span>
                    </div>
                  )}
                  {deleteStatus.caseDone && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1D9E75]" />
                      <span className="text-gray-600">案件删除</span>
                      <span className="text-[#1D9E75]">已完成</span>
                    </div>
                  )}
                  {deleteStatus.accountDone && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1D9E75]" />
                      <span className="text-gray-600">账户删除</span>
                      <span className="text-[#1D9E75]">已完成</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 二次确认弹窗 */}
      {deleteConfirm && (
        <ConfirmDialog
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          confirmText={
            deleteConfirm.level === "file"
              ? "确认删除文件"
              : deleteConfirm.level === "case"
                ? "确认删除案件"
                : "确认删除账户"
          }
          danger={deleteConfirm.level !== "file"}
          onConfirm={executeDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
