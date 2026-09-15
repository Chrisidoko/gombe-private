"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChartNoAxesGantt,
  ClipboardCheck,
  Settings2,
  Target,
  Loader2,
  ArrowRight,
  Wallet,
} from "lucide-react";

type BulkAssessment = { id: number };
type Evaluation = { id: number; total_revenue: string };
type DemandNotice = { id: number; amount: string };
type TargetRow = { id: number; quarter: number; target: string };
type BulkCategory = { fee: string | null; schools: unknown[] };

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => (
  <div
    className="bg-white rounded-lg shadow-md p-5 border-b-4 transition-all hover:shadow-lg"
    style={{ borderBottomColor: color }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
  </div>
);

function QueueLink({
  href,
  label,
  description,
  badge,
  icon,
  loading,
}: {
  href: string;
  label: string;
  description: string;
  badge: React.ReactNode;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-green-200 transition-all"
    >
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 shrink-0">
        <div className="text-amber-600">{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
        ) : (
          badge
        )}
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#28a745] group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

function formatCurrency(v: number) {
  return `₦${v.toLocaleString()}`;
}

export default function ReviewDashboardPage() {
  const [bulk, setBulk] = useState<BulkAssessment[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [notices, setNotices] = useState<DemandNotice[]>([]);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [bulkValue, setBulkValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [bulkRes, evalRes, noticeRes, targetRes] = await Promise.allSettled(
        [
          fetch("/api/operator2/bulk").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/operator2/evaluations").then((r) =>
            r.ok ? r.json() : { assessments: [] },
          ),
          fetch("/api/operator2/demand-notices").then((r) =>
            r.ok ? r.json() : [],
          ),
          fetch(`/api/operator2/revenue-targets?year=${currentYear}`).then(
            (r) => (r.ok ? r.json() : { targets: [] }),
          ),
        ],
      );

      const bulkItems: BulkAssessment[] =
        bulkRes.status === "fulfilled" ? (bulkRes.value ?? []) : [];
      setBulk(bulkItems);
      if (evalRes.status === "fulfilled")
        setEvaluations(evalRes.value?.assessments ?? []);
      if (noticeRes.status === "fulfilled") setNotices(noticeRes.value ?? []);
      if (targetRes.status === "fulfilled")
        setTargets(targetRes.value?.targets ?? []);

      // Bulk assessments don't carry a per-item ₦ total — each one splits across
      // tier fees by however many schools fall in each tier — so that has to be
      // fetched per assessment from the same breakdown the review-bulk page uses.
      if (bulkItems.length > 0) {
        const schoolsResults = await Promise.allSettled(
          bulkItems.map((a) =>
            fetch(`/api/operator2/bulk/${a.id}/schools`).then((r) =>
              r.ok ? r.json() : null,
            ),
          ),
        );
        const total = schoolsResults.reduce((sum, res) => {
          if (res.status !== "fulfilled" || !res.value) return sum;
          const categories: BulkCategory[] = res.value.categories ?? [];
          const itemValue = categories.reduce(
            (s, c) => s + Number(c.fee || 0) * c.schools.length,
            0,
          );
          return sum + itemValue;
        }, 0);
        setBulkValue(total);
      } else {
        setBulkValue(0);
      }

      setLoading(false);
    }
    load();
  }, [currentYear]);

  const pendingBulk = bulk.length;
  const pendingEvaluations = evaluations.length;
  const pendingNotices = notices.length;
  const totalPending = pendingBulk + pendingEvaluations + pendingNotices;

  const pendingValue =
    bulkValue +
    evaluations.reduce((sum, e) => sum + Number(e.total_revenue || 0), 0) +
    notices.reduce((sum, n) => sum + Number(n.amount || 0), 0);

  const quartersSet = targets.length;
  const annualTarget = targets.reduce(
    (sum, t) => sum + Number(t.target || 0),
    0,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Directors Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of items awaiting your review across all queues.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ministry Assessments"
          value={loading ? "—" : pendingBulk}
          icon={<ChartNoAxesGantt size={20} />}
          color="#f59e0b"
          subtitle="Awaiting your decision"
        />
        <StatCard
          title="Self Assessments"
          value={loading ? "—" : pendingEvaluations}
          icon={<ClipboardCheck size={20} />}
          color="#8b5cf6"
          subtitle="Recommended by Operator"
        />
        <StatCard
          title="Demand Notices"
          value={loading ? "—" : pendingNotices}
          icon={<Settings2 size={20} />}
          color="#3b82f6"
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Total Items Pending"
          value={loading ? "—" : totalPending}
          icon={<Wallet size={20} />}
          color="#28a745"
          subtitle={
            loading ? undefined : `${formatCurrency(pendingValue)} in value`
          }
        />
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
          Review Queues
        </h2>
        <div className="space-y-3">
          <QueueLink
            href="/review-bulk"
            label="Review Bulk Assessments"
            description="Ministry assessments submitted by Operator"
            badge={
              <span
                className={`text-lg font-black ${pendingBulk > 0 ? "text-[#28a745]" : "text-gray-300"}`}
              >
                {pendingBulk}
              </span>
            }
            icon={<ChartNoAxesGantt size={18} />}
            loading={loading}
          />
          <QueueLink
            href="/review-evaluations"
            label="Review Self Assessments"
            description="School self-assessments recommended by Operator"
            badge={
              <span
                className={`text-lg font-black ${pendingEvaluations > 0 ? "text-[#28a745]" : "text-gray-300"}`}
              >
                {pendingEvaluations}
              </span>
            }
            icon={<ClipboardCheck size={18} />}
            loading={loading}
          />
          <QueueLink
            href="/review-demand-notices"
            label="Review Demand Notices"
            description="Flat fee demand notices submitted by Operator"
            badge={
              <span
                className={`text-lg font-black ${pendingNotices > 0 ? "text-[#28a745]" : "text-gray-300"}`}
              >
                {pendingNotices}
              </span>
            }
            icon={<Settings2 size={18} />}
            loading={loading}
          />
          <QueueLink
            href="/revenue-targets"
            label="Revenue Targets"
            description={`${currentYear} targets — ${formatCurrency(annualTarget)} annual`}
            badge={
              <span className="text-xs font-bold text-gray-500">
                {quartersSet}/4 set
              </span>
            }
            icon={<Target size={18} />}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
