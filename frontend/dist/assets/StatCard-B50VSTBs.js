import{c as m,j as e,k as s}from"./index-DYRJlwnw.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=m("ArrowDownRight",[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=m("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]),h={heart:"bg-metric-heart/10 text-metric-heart",steps:"bg-metric-steps/10 text-metric-steps",sleep:"bg-metric-sleep/10 text-metric-sleep",calories:"bg-metric-calories/10 text-metric-calories",active:"bg-metric-active/10 text-metric-active",weight:"bg-metric-weight/10 text-metric-weight",primary:"bg-primary/10 text-primary"};function u({label:n,value:o,unit:r,delta:t,icon:i,accent:l="primary",className:d,children:a}){const c=typeof t=="number"&&t>=0;return e.jsxs("div",{className:s("group rounded-2xl bg-card border border-border p-5 hover:border-foreground/20 transition-colors",d),children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("p",{className:"text-xs font-medium text-muted-foreground uppercase tracking-wider",children:n}),e.jsxs("div",{className:"mt-2 flex items-baseline gap-1.5",children:[e.jsx("span",{className:"text-3xl font-display font-bold tracking-tight text-foreground tabular-nums",children:o}),r&&e.jsx("span",{className:"text-sm font-medium text-muted-foreground",children:r})]}),typeof t=="number"&&e.jsxs("div",{className:s("mt-2 inline-flex items-center gap-1 text-xs font-medium",c?"text-metric-active":"text-metric-heart"),children:[c?e.jsx(p,{className:"w-3.5 h-3.5"}):e.jsx(x,{className:"w-3.5 h-3.5"}),e.jsxs("span",{className:"tabular-nums",children:[Math.abs(t).toFixed(1),"%"]}),e.jsx("span",{className:"text-muted-foreground font-normal",children:"vs last week"})]})]}),i&&e.jsx("div",{className:s("inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0",h[l]),children:i})]}),a&&e.jsx("div",{className:"mt-4",children:a})]})}export{u as S};
//# sourceMappingURL=StatCard-B50VSTBs.js.map
