import fs from 'fs';
const content = fs.readFileSync('src/app/(dashboard)/material/page.tsx', 'utf8');
const match = content.match(/const columns: ColumnDef<any>\[\] = \[([\s\S]*?)\];/);
if (match) {
  console.log("Matched content:", match[1].substring(0, 50));
  // We can't easily eval TS, but we can check if it starts with an empty object
  console.log("Starts with { accessorKey: 'projectId':", match[1].includes('accessorKey: "projectId"'));
}
