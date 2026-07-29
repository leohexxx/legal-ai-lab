// ============================================================
// Legal AI Lab — 模拟律师数据库
// 用于 S5 律师转交和律师端功能测试
// ============================================================

export interface Lawyer {
  id: string;
  name: string;
  firm: string;
  city: string;
  specialties: string[];
  yearsOfExperience: number;
  licenseNumber: string;
  rating: number;        // 1-5
  caseCount: number;
  feeRange: { min: number; max: number }; // 元
  tags: string[];
  availability: "available" | "busy" | "unavailable";
  bio: string;
  successRate: number;   // 百分比
  responseTime: string;  // 平均响应时间
}

export const MOCK_LAWYERS: Lawyer[] = [
  {
    id: "L001",
    name: "张明华",
    firm: "北京明华律师事务所",
    city: "北京市",
    specialties: ["劳动争议", "合同纠纷", "工伤赔偿"],
    yearsOfExperience: 12,
    licenseNumber: "1110120201****",
    rating: 4.8,
    caseCount: 326,
    feeRange: { min: 3000, max: 15000 },
    tags: ["劳动法专家", "仲裁经验丰富", "响应快"],
    availability: "available",
    bio: "专注劳动争议领域12年，累计代理劳动争议案件300+件，熟悉北京、上海、广州等地仲裁和诉讼流程。",
    successRate: 85,
    responseTime: "2小时内",
  },
  {
    id: "L002",
    name: "李雪梅",
    firm: "上海正和法律咨询",
    city: "上海市",
    specialties: ["劳动争议", "社保纠纷", "人事合规"],
    yearsOfExperience: 8,
    licenseNumber: "1310120202****",
    rating: 4.6,
    caseCount: 198,
    feeRange: { min: 2000, max: 10000 },
    tags: ["耐心细致", "擅长调解", "性价比高"],
    availability: "available",
    bio: "擅长劳动争议调解和仲裁代理，尤其擅长社保纠纷和工时工资争议，注重通过调解快速解决问题。",
    successRate: 78,
    responseTime: "4小时内",
  },
  {
    id: "L003",
    name: "王建国",
    firm: "广东国晖律师事务所",
    city: "广州市",
    specialties: ["劳动争议", "民商事诉讼", "企业法律顾问"],
    yearsOfExperience: 15,
    licenseNumber: "4410120203****",
    rating: 4.9,
    caseCount: 512,
    feeRange: { min: 5000, max: 30000 },
    tags: ["资深律师", "诉讼经验丰富", "企业背景"],
    availability: "busy",
    bio: "前企业法务总监，转型律师15年，擅长处理复杂劳动纠纷和群体性劳动争议，代理过多起重大案件。",
    successRate: 90,
    responseTime: "6小时内",
  },
  {
    id: "L004",
    name: "陈思远",
    firm: "杭州泽厚律师事务所",
    city: "杭州市",
    specialties: ["劳动争议", "互联网行业合规", "知识产权"],
    yearsOfExperience: 6,
    licenseNumber: "3310120204****",
    rating: 4.5,
    caseCount: 145,
    feeRange: { min: 2000, max: 8000 },
    tags: ["新锐律师", "互联网行业", "青年律师"],
    availability: "available",
    bio: "专注互联网行业劳动法律事务，熟悉互联网企业用工模式和竞业限制纠纷，为多家科技企业提供法律咨询。",
    successRate: 75,
    responseTime: "3小时内",
  },
  {
    id: "L005",
    name: "赵晓岚",
    firm: "成都明炬律师事务所",
    city: "成都市",
    specialties: ["劳动争议", "工伤赔偿", "道路交通事故"],
    yearsOfExperience: 10,
    licenseNumber: "5110120205****",
    rating: 4.7,
    caseCount: 267,
    feeRange: { min: 2500, max: 12000 },
    tags: ["工伤专家", "西南地区", "经验丰富"],
    availability: "available",
    bio: "西南地区知名劳动法律师，尤其擅长工伤认定和赔偿案件，为多名建筑工人成功争取到工伤赔偿。",
    successRate: 82,
    responseTime: "4小时内",
  },
  {
    id: "L006",
    name: "刘浩然",
    firm: "北京中伦律师事务所",
    city: "北京市",
    specialties: ["劳动争议", "公司法", "商事仲裁"],
    yearsOfExperience: 20,
    licenseNumber: "1110120206****",
    rating: 5.0,
    caseCount: 680,
    feeRange: { min: 10000, max: 50000 },
    tags: ["顶级律师", "大所背景", "复杂案件"],
    availability: "busy",
    bio: "红圈所资深合伙人，处理过大量复杂劳动纠纷和群体性事件，担任多家500强企业法律顾问。",
    successRate: 93,
    responseTime: "12小时内",
  },
  {
    id: "L007",
    name: "吴芳",
    firm: "深圳华商律师事务所",
    city: "深圳市",
    specialties: ["劳动争议", "涉外劳动法", "人事合规"],
    yearsOfExperience: 7,
    licenseNumber: "4410120207****",
    rating: 4.4,
    caseCount: 178,
    feeRange: { min: 3000, max: 15000 },
    tags: ["涉外法律", "英语服务", "科技企业"],
    availability: "available",
    bio: "具有涉外法律服务背景，能处理外籍员工劳动纠纷和跨境用工合规问题，服务过多家知名科技企业。",
    successRate: 76,
    responseTime: "3小时内",
  },
  {
    id: "L008",
    name: "黄志强",
    firm: "武汉得伟君尚律师事务所",
    city: "武汉市",
    specialties: ["劳动争议", "建筑行业纠纷", "人身损害赔偿"],
    yearsOfExperience: 14,
    licenseNumber: "4210120208****",
    rating: 4.6,
    caseCount: 389,
    feeRange: { min: 2000, max: 10000 },
    tags: ["建筑行业", "华中地区", "公益法律服务"],
    availability: "available",
    bio: "专注建筑行业劳动纠纷，为大量建筑工人提供法律援助和代理服务，熟悉建筑工程分包用工模式。",
    successRate: 80,
    responseTime: "4小时内",
  },
];

export function getLawyerById(id: string): Lawyer | undefined {
  return MOCK_LAWYERS.find((l) => l.id === id);
}

export function filterLawyers(params: {
  city?: string;
  specialties?: string[];
  maxFee?: number;
  availability?: "available" | "busy" | "unavailable";
}): Lawyer[] {
  let result = [...MOCK_LAWYERS];

  if (params.city) {
    result = result.filter((l) => l.city.includes(params.city!));
  }
  if (params.specialties && params.specialties.length > 0) {
    result = result.filter((l) =>
      params.specialties!.some((s) => l.specialties.includes(s))
    );
  }
  if (params.maxFee) {
    result = result.filter((l) => l.feeRange.min <= params.maxFee!);
  }
  if (params.availability) {
    result = result.filter((l) => l.availability === params.availability);
  }

  return result;
}
