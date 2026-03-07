import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const productionData = [
  { month: "Jan", efficiency: 82, target: 90 },
  { month: "Feb", efficiency: 85, target: 90 },
  { month: "Mar", efficiency: 88, target: 90 },
  { month: "Apr", efficiency: 84, target: 90 },
  { month: "May", efficiency: 91, target: 90 },
  { month: "Jun", efficiency: 94, target: 90 },
];

const costSavingsData = [
  { month: "Jan", savings: 12000, procurement: 45000 },
  { month: "Feb", savings: 18000, procurement: 42000 },
  { month: "Mar", savings: 15000, procurement: 48000 },
  { month: "Apr", savings: 22000, procurement: 40000 },
  { month: "May", savings: 28000, procurement: 38000 },
  { month: "Jun", savings: 35000, procurement: 36000 },
];

const defectData = [
  { name: "Critical", value: 3, color: "hsl(0, 84%, 60%)" },
  { name: "Major", value: 12, color: "hsl(38, 92%, 50%)" },
  { name: "Minor", value: 28, color: "hsl(0, 0%, 60%)" },
  { name: "None", value: 157, color: "hsl(142, 71%, 45%)" },
];

const machineData = [
  { machine: "M1", utilization: 92 },
  { machine: "M2", utilization: 87 },
  { machine: "M3", utilization: 95 },
  { machine: "M4", utilization: 78 },
  { machine: "M5", utilization: 88 },
];

const profitData = [
  { month: "Jan", revenue: 450000, cost: 380000, profit: 70000 },
  { month: "Feb", revenue: 520000, cost: 410000, profit: 110000 },
  { month: "Mar", revenue: 480000, cost: 390000, profit: 90000 },
  { month: "Apr", revenue: 580000, cost: 420000, profit: 160000 },
  { month: "May", revenue: 620000, cost: 430000, profit: 190000 },
  { month: "Jun", revenue: 680000, cost: 450000, profit: 230000 },
];

const supplierData = [
  { supplier: "S1", reliability: 96, cost: 85 },
  { supplier: "S2", reliability: 92, cost: 78 },
  { supplier: "S3", reliability: 88, cost: 90 },
  { supplier: "S4", reliability: 94, cost: 82 },
  { supplier: "S5", reliability: 85, cost: 72 },
];

function ChartCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-medium mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-5 h-5" />
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manufacturing performance insights and trends
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Production Efficiency */}
        <ChartCard title="Production Efficiency vs Target" delay={0.05}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" domain={[70, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} />
              <Area type="monotone" dataKey="efficiency" stroke="hsl(0 0% 9%)" fill="hsl(0 0% 9% / 0.1)" strokeWidth={2} />
              <Area type="monotone" dataKey="target" stroke="hsl(142 71% 45%)" fill="none" strokeDasharray="5 5" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Profit Margins */}
        <ChartCard title="Revenue & Profit Trends" delay={0.1}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" fill="hsl(0 0% 9%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Machine Utilization */}
        <ChartCard title="Machine Utilization (%)" delay={0.15}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={machineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" domain={[0, 100]} />
              <YAxis type="category" dataKey="machine" tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} />
              <Bar dataKey="utilization" fill="hsl(0 0% 9%)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Defect Distribution */}
        <ChartCard title="Defect Distribution" delay={0.2}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={defectData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {defectData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cost Savings */}
        <ChartCard title="Cost Savings Trend" delay={0.25}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={costSavingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="savings" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="procurement" stroke="hsl(0 0% 9%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Supplier Performance */}
        <ChartCard title="Supplier Performance" delay={0.3}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={supplierData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis dataKey="supplier" tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="reliability" fill="hsl(0 0% 9%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="hsl(0 0% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
