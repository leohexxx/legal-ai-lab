"""Precisely add context_id to all AskResponse returns in chat_service.py."""
import re

with open('app/services/chat_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find each "return AskResponse(" block and its matching closing ")"
# Then add context_id=context_id before the final ")"

result = []
i = 0
count = 0
while i < len(content):
    pos = content.find('return AskResponse(', i)
    if pos == -1:
        result.append(content[i:])
        break

    # Text before this match
    result.append(content[i:pos])

    # Find the matching closing paren
    start = pos + len('return AskResponse(')
    depth = 1
    j = start
    while j < len(content) and depth > 0:
        if content[j] == '(':
            depth += 1
        elif content[j] == ')':
            depth -= 1
        j += 1

    block = content[pos:j]  # this includes "return AskResponse(" ... ")"

    if 'context_id' not in block:
        count += 1
        # Find last ')' and add context_id before it
        # Actually block ends with ")" since j points past the matching paren
        # Remove the trailing ")"
        inner = block[:-1].rstrip()
        # Remove trailing comma if present
        if inner.endswith(','):
            inner = inner[:-1].rstrip()
        block = inner + ',\n            contextId=context_id)'

    result.append(block)
    i = j

new_content = ''.join(result)
print(f'Updated {count} return statements')

with open('app/services/chat_service.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

import ast
try:
    ast.parse(new_content)
    print('Syntax: OK')

    # Verify context_id count
    import_count = new_content.count('context_id=context_id')
    askresp_count = new_content.count('return AskResponse(')
    print(f'context_id=context_id found: {import_count} times')
    print(f'return AskResponse( found: {askresp_count} times')
except SyntaxError as e:
    print(f'Syntax Error: {e}')
    lines = new_content.split('\n')
    if e.lineno:
        print(f'Line {e.lineno}: {lines[e.lineno-1]}')
