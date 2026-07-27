# 知识数据

存放结构化的规则卡、证据卡、程序卡、案例卡等知识包。

## 目录约定

```
knowledge/
  labor/              劳动法知识包
    rules/            规则卡 YAML/JSON
    evidence/         证据卡
    procedures/       程序卡
    cases/            案例卡
    scenarios/        场景卡
  json_schemas/       自动生成的 JSON Schema 文件
  source_whitelist.yaml  来源白名单
  legal_ontology.yaml    法律本体定义
```

## 知识管理规则

- 每条知识记录必须可回溯至来源白名单中的登记项。
- 每条知识记录必须标注审核状态（draft / reviewed / published）。
- 内容变更应保留版本记录并触发回归评测。
- 进入用户输出前应经过法律专业人士抽样或专项审核。
