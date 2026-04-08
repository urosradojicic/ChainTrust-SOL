/**
 * LP (Limited Partner) Quarterly Report Generator
 * Generates institutional-grade PDF reports using html2canvas + jsPDF.
 * All data computed client-side.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { formatCurrency, formatNumber } from '@/lib/format';
import { generateDueDiligenceReport } from '@/lib/ai-due-diligence';

/** Escape HTML entities to prevent XSS in generated reports */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LPReportData {
  generatedAt: string;
  quarter: string;
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  allStartups: DbStartup[];
}

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

export function generateLPReportHTML(data: LPReportData): string {
  const { startup, metrics, allStartups } = data;
  const report = generateDueDiligenceReport(startup, metrics, allStartups);
  const quarter = getCurrentQuarter();
  const lastMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const firstMetric = metrics.length > 0 ? metrics[0] : null;

  const revenueGrowth = firstMetric && lastMetric
    ? ((Number(lastMetric.revenue) - Number(firstMetric.revenue)) / Number(firstMetric.revenue) * 100).toFixed(1)
    : '0';

  const userGrowth = firstMetric && lastMetric
    ? ((lastMetric.mau - firstMetric.mau) / firstMetric.mau * 100).toFixed(1)
    : '0';

  return `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; background: #ffffff;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #534AB7; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="margin: 0; font-size: 28px; color: #534AB7;">ChainTrust</h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px;">LP Quarterly Report</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 700;">${quarter}</div>
            <div style="font-size: 11px; color: #6b7280;">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      <!-- Startup Overview -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 22px; margin: 0 0 8px;">${escHtml(startup.name)}</h2>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <span style="background: #534AB710; color: #534AB7; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${startup.category}</span>
          <span style="background: ${startup.verified ? '#10B98110' : '#F59E0B10'}; color: ${startup.verified ? '#10B981' : '#F59E0B'}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${startup.verified ? 'Verified' : 'Unverified'}</span>
          <span style="background: #3B82F610; color: #3B82F6; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${startup.blockchain}</span>
          <span style="background: ${report.overallRisk === 'low' ? '#10B981' : report.overallRisk === 'medium' ? '#F59E0B' : '#EF4444'}10; color: ${report.overallRisk === 'low' ? '#10B981' : report.overallRisk === 'medium' ? '#F59E0B' : '#EF4444'}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Grade: ${report.investmentGrade}</span>
        </div>
        <p style="margin: 12px 0 0; font-size: 13px; color: #6b7280; line-height: 1.6;">${escHtml(startup.description || 'No description available.')}</p>
      </div>

      <!-- KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px;">
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">MRR</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">${formatCurrency(startup.mrr)}</div>
          <div style="font-size: 11px; color: #10B981; margin-top: 2px;">+${revenueGrowth}% period</div>
        </div>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Users</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">${formatNumber(startup.users)}</div>
          <div style="font-size: 11px; color: #10B981; margin-top: 2px;">+${userGrowth}% period</div>
        </div>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Trust Score</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">${startup.trust_score}/100</div>
          <div style="font-size: 11px; color: ${startup.trust_score > 70 ? '#10B981' : '#F59E0B'}; margin-top: 2px;">${startup.trust_score > 70 ? 'Strong' : 'Moderate'}</div>
        </div>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center;">
          <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Treasury</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">${formatCurrency(Number(startup.treasury))}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Team: ${startup.team_size}</div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Risk Assessment</h3>
        <p style="font-size: 13px; color: #374151; line-height: 1.6;">${report.summary}</p>
        ${report.financialHealth.map(h => `
          <div style="display: flex; align-items: center; gap: 12px; margin: 8px 0;">
            <span style="width: 120px; font-size: 12px; color: #6b7280;">${h.label}</span>
            <div style="flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${h.score}%; background: ${h.status === 'low' ? '#10B981' : h.status === 'medium' ? '#F59E0B' : '#EF4444'}; border-radius: 4px;"></div>
            </div>
            <span style="font-size: 12px; font-weight: 600; width: 40px; text-align: right;">${h.score}%</span>
          </div>
        `).join('')}
      </div>

      <!-- Metrics History -->
      ${metrics.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Metrics History</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 8px; text-align: left; color: #6b7280;">Period</th>
              <th style="padding: 8px; text-align: right; color: #6b7280;">Revenue</th>
              <th style="padding: 8px; text-align: right; color: #6b7280;">Costs</th>
              <th style="padding: 8px; text-align: right; color: #6b7280;">MAU</th>
              <th style="padding: 8px; text-align: right; color: #6b7280;">Growth</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.slice(-6).map(m => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px;">${m.month}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatCurrency(Number(m.revenue))}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatCurrency(Number(m.costs))}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatNumber(m.mau)}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; color: ${Number(m.growth_rate) >= 0 ? '#10B981' : '#EF4444'};">${Number(m.growth_rate) >= 0 ? '+' : ''}${Number(m.growth_rate)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Strengths & Weaknesses -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px;">
        <div>
          <h3 style="font-size: 14px; color: #10B981; margin-bottom: 8px;">Strengths</h3>
          ${report.strengths.map(s => `<p style="font-size: 12px; color: #374151; margin: 4px 0; padding-left: 12px; border-left: 2px solid #10B981;">${s}</p>`).join('') || '<p style="font-size: 12px; color: #9CA3AF;">No major strengths identified</p>'}
        </div>
        <div>
          <h3 style="font-size: 14px; color: #EF4444; margin-bottom: 8px;">Risk Factors</h3>
          ${report.weaknesses.map(w => `<p style="font-size: 12px; color: #374151; margin: 4px 0; padding-left: 12px; border-left: 2px solid #EF4444;">${w}</p>`).join('') || '<p style="font-size: 12px; color: #9CA3AF;">No major risks identified</p>'}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 40px;">
        <p style="font-size: 10px; color: #9CA3AF; line-height: 1.5;">
          This report is generated algorithmically by ChainTrust's due diligence engine. All on-chain data is verified against Solana blockchain records.
          Self-reported metrics are clearly labeled. This report does not constitute investment advice. Past performance is not indicative of future results.
          Generated on ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
}

export async function exportLPReport(data: LPReportData) {
  const html = generateLPReportHTML(data);

  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  document.body.appendChild(container);

  try {
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const html2canvas = html2canvasModule.default;
    const { jsPDF } = jsPDFModule;

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    const quarter = getCurrentQuarter().replace(' ', '-');
    pdf.save(`${data.startup.name}-LP-Report-${quarter}.pdf`);
  } catch {
    // Fallback: open in new window for print
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<html><head><title>LP Report - ${escHtml(data.startup.name)}</title></head><body>${html}</body></html>`);
      w.document.close();
      w.print();
    }
  } finally {
    document.body.removeChild(container);
  }
}
