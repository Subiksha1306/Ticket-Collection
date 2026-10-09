import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM
    const allParam = searchParams.get('all'); // true

    let whereClause = {};
    let filename = 'impactx-export-all.html';
    let displayMonth = 'All Time';
    let dateRangeText = 'All submissions';

    if (!allParam && monthParam) {
      const [yearStr, monthStr] = monthParam.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // 0-indexed for Date

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      whereClause = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
      filename = `impactx-export-${monthParam}.html`;
      displayMonth = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      dateRangeText = `Submissions created ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        author: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 1. Group by Author for the Contributors Table
    const authorsMap = new Map();
    submissions.forEach(sub => {
      const aName = sub.author?.name || 'Unknown';
      if (!authorsMap.has(aName)) {
        authorsMap.set(aName, { name: aName, tickets: 0, advanced: 0, totalScore: 0, scoredCount: 0 });
      }
      const data = authorsMap.get(aName);
      data.tickets++;
      if (sub.score !== null) {
        data.totalScore += sub.score;
        data.scoredCount++;
        if (sub.score >= 90) data.advanced++;
      }
    });

    let maxTickets = 0;
    const contributors = Array.from(authorsMap.values())
      .map(a => {
        if (a.tickets > maxTickets) maxTickets = a.tickets;
        return {
          name: a.name,
          tickets: a.tickets,
          advanced: a.advanced,
          avgScore: a.scoredCount > 0 ? Math.round(a.totalScore / a.scoredCount) : 0
        };
      })
      .sort((a, b) => b.tickets - a.tickets || b.avgScore - a.avgScore);

    // 2. Group by Status
    const statusOrder = ["Impact Verified", "Implemented", "Approved", "Under Review", "Submitted"];
    const statusColors = {
      "Impact Verified": "#7c3aed",
      "Implemented": "#059669",
      "Approved": "#2563eb",
      "Under Review": "#d97706",
      "Submitted": "#64748b"
    };

    const statusGroups = {
      "Impact Verified": [],
      "Implemented": [],
      "Approved": [],
      "Under Review": [],
      "Submitted": []
    };

    submissions.forEach(sub => {
      const s = statusGroups[sub.status] ? sub.status : "Submitted";
      statusGroups[s].push(sub);
    });

    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ImpactX Report – ${displayMonth}</title>
<style>
${CSS_PLACEHOLDER}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <div class="brand">ImpactX</div>
      <h1>Monthly report – ${displayMonth}</h1>
      <p>${dateRangeText} · exported from the Manager Dashboard</p>
    </div>
    <div class="pill">${submissions.length} submissions</div>
  </header>

  <div class="card" style="margin-top:20px">
    <h2>Contributors</h2>
    <table>
      <tr><th>Employee</th><th></th><th class="num">Tickets</th><th class="num">Advanced</th><th class="num">Avg score</th></tr>
      ${contributors.map(c => `<tr>
        <td>${c.name}</td>
        <td><div class="tr sm"><div class="fl" style="width:${Math.round((c.tickets / maxTickets) * 100)}%"></div></div></td>
        <td class="num">${c.tickets.toFixed(1)}</td>
        <td class="num">${c.advanced}</td>
        <td class="num">${c.avgScore || '-'}</td>
      </tr>`).join('')}
    </table>
  </div>

  <div class="ctrl">
    <input id="q" type="search" placeholder="Search by ticket, title, person or category…">
    ${statusOrder.map(st => `<button class="fc" data-f="${st}"><span class="dot" style="background:${statusColors[st]}"></span>${st} <b>${statusGroups[st].length}</b></button>`).join('')}
    <button class="btn" id="ex">Expand all</button>
    <button class="btn" id="co">Collapse all</button>
  </div>

  <div id="list">
    ${statusOrder.map(st => {
      const subs = statusGroups[st];
      if (subs.length === 0) return '';
      return `<section class="grp" data-g="${st}">
        <h3><span class="dot" style="background:${statusColors[st]}"></span>${st}<span class="cnt">${subs.length}</span></h3>
        ${subs.map(sub => {
          const v = sub.versions[0];
          const title = v?.title || 'No Title';
          const authorName = sub.author?.name || 'Unknown';
          const cat = sub.category || 'Uncategorized';
          const date = new Date(sub.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const searchStr = `${sub.ticketNumber} ${title} ${authorName} ${cat}`.toLowerCase();
          const scoreHtml = sub.score !== null 
            ? `<span class="score">${sub.score}</span>` 
            : `<span class="score un">Unscored</span>`;
          
          return `<details class="tk" data-s="${searchStr.replace(/"/g, '&quot;')}">
            <summary>
              <span class="tn">${sub.ticketNumber}</span>
              <span class="tt">${title}</span>
              <span class="who">${authorName}</span>
              ${scoreHtml}
              <i class="car"></i>
            </summary>
            <div class="body">
              <div class="meta">
                <span class="chip">${cat}</span>
                <span class="chip ver">v${v?.versionNumber || 1}</span>
                <span class="d">Created ${date}</span>
              </div>
              <p>${(v?.description || '').replace(/\n/g, '<br>')}</p>
            </div>
          </details>`;
        }).join('')}
      </section>`;
    }).join('')}
  </div>

  <div class="empty" id="empty">No tickets match your search.</div>
  <footer>Generated from ${filename} · ImpactX</footer>
</div>

<script>
${JS_PLACEHOLDER}
</script>
</body>
</html>`;

    htmlContent = htmlContent.replace('${CSS_PLACEHOLDER}', `*{box-sizing:border-box}body{margin:0;background:#f3f4f6;color:#111827;font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:32px 20px 60px}
header{background:#141a2e;color:#fff;border-radius:16px;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
header h1{margin:0;font-size:28px;letter-spacing:-.3px}header p{margin:4px 0 0;color:#a5b0cf}
.brand{font-weight:700;font-size:14px;color:#a5b4fc;letter-spacing:.5px;margin-bottom:6px}
.pill{background:#4f46e5;border-radius:10px;padding:8px 14px;font-weight:600;font-size:14px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:20px 0}
.k{background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.k .l{font-size:13px;color:#6b7280}.k .v{font-size:30px;font-weight:700;margin-top:2px}.k .s{font-size:12px;color:#6b7280}
.row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
@media(max-width:800px){.row{grid-template-columns:1fr}}
.card{background:#fff;border-radius:14px;padding:20px 22px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.card h2{font-size:16px;margin:0 0 16px}
.pipe{display:flex;justify-content:space-between;gap:8px}.pi{text-align:center;flex:1}
.ic{width:56px;height:56px;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
.pl{font-size:12px;color:#4b5563}
.br{display:grid;grid-template-columns:150px 1fr 30px;gap:10px;align-items:center;margin:9px 0;font-size:13px}.br b{text-align:right}.muted{color:#6b7280}
.tr{background:#eef0f6;border-radius:6px;height:14px;overflow:hidden}.tr.sm{height:10px}.fl{background:#6366f1;height:100%;border-radius:6px}
.cols{display:flex;align-items:flex-end;justify-content:space-around;height:140px}.col{text-align:center;flex:1}
.cb{background:#6366f1;border-radius:6px 6px 0 0;margin:0 auto;width:42px}.cv{font-size:13px;font-weight:600}.cl{font-size:12px;color:#6b7280;margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:#6b7280;font-weight:500;padding:6px 8px;border-bottom:1px solid #e5e7eb}td{padding:8px;border-bottom:1px solid #f1f2f6}.num{text-align:right;width:56px}
.ctrl{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:26px 0 14px}
.ctrl input{flex:1;min-width:220px;padding:10px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;background:#fff}
.btn,.fc{border:1px solid #d1d5db;background:#fff;border-radius:999px;padding:7px 13px;font-size:13px;cursor:pointer}.fc.on{background:#141a2e;color:#fff;border-color:#141a2e}
.btn{border-radius:10px}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}
.grp h3{display:flex;align-items:center;font-size:17px;margin:26px 0 10px}.cnt{margin-left:10px;background:#e5e7eb;border-radius:999px;font-size:12px;padding:1px 9px}
.tk{background:#fff;border-radius:12px;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.tk summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:110px 1fr 190px 70px 16px;gap:12px;align-items:center;padding:13px 16px}
.tk summary::-webkit-details-marker{display:none}
@media(max-width:800px){.tk summary{grid-template-columns:70px 1fr 56px 14px}.who{display:none}}
.tn{font-weight:700;font-size:13px;color:#4338ca;word-break:break-word}.tt{font-weight:500}.who{color:#6b7280;font-size:13px}
.score{background:#eef2ff;color:#4338ca;font-weight:700;border-radius:8px;padding:2px 0;text-align:center;font-size:13px}.score.un{background:#f3f4f6;color:#9ca3af;font-weight:500;font-size:11px}
.car{width:8px;height:8px;border-right:2px solid #9ca3af;border-bottom:2px solid #9ca3af;transform:rotate(45deg);transition:.15s}details[open] .car{transform:rotate(-135deg)}
.body{padding:2px 20px 18px;border-top:1px solid #f1f2f6;font-size:14px;color:#1f2937}.body p{margin:10px 0}.body ul,.body ol{margin:8px 0;padding-left:22px}
.body code{background:#f3f4f6;padding:1px 5px;border-radius:4px;font-size:13px}
.meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0 4px}.chip{background:#eef2ff;color:#4338ca;border-radius:999px;padding:2px 10px;font-size:12px}.chip.ver{background:#f3f4f6;color:#4b5563}.d{font-size:12px;color:#6b7280}
.empty{display:none;text-align:center;color:#6b7280;padding:30px}
footer{text-align:center;color:#9ca3af;font-size:12px;margin-top:36px}
@media print{body{background:#fff}.ctrl{display:none}.tk .body{display:block}details:not([open]) .body{display:block}.card,.k,.tk{box-shadow:none;border:1px solid #e5e7eb}header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`);
    htmlContent = htmlContent.replace('${JS_PLACEHOLDER}', `var q=document.getElementById('q'),act=null,tks=[].slice.call(document.querySelectorAll('.tk')),grps=[].slice.call(document.querySelectorAll('.grp'));
function run(){var t=q.value.trim().toLowerCase(),n=0;tks.forEach(function(k){var g=k.parentNode.getAttribute('data-g');var ok=(!act||g===act)&&(!t||k.getAttribute('data-s').indexOf(t)>-1);k.style.display=ok?'':'none';if(ok)n++;});
grps.forEach(function(g){g.style.display=[].some.call(g.querySelectorAll('.tk'),function(k){return k.style.display!=='none'})?'':'none'});document.getElementById('empty').style.display=n?'none':'block'}
q.addEventListener('input',run);
[].forEach.call(document.querySelectorAll('.fc'),function(b){b.addEventListener('click',function(){var f=b.getAttribute('data-f');act=act===f?null:f;[].forEach.call(document.querySelectorAll('.fc'),function(x){x.classList.toggle('on',x.getAttribute('data-f')===act)});run()})});
document.getElementById('ex').onclick=function(){tks.forEach(function(k){if(k.style.display!=='none')k.open=true})};
document.getElementById('co').onclick=function(){tks.forEach(function(k){k.open=false})};`);

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return new NextResponse(`Internal Server Error: ${error.message || error.toString()}`, { status: 500 });
  }
}
