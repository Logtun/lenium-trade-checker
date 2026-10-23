(function(){
"use strict";
var RULES="https://www.lenium.capital/rules", PRICING="https://www.lenium.capital/pricing", FEEPAGE="https://www.lenium.capital/tools/prediction-market-fee-calculator";
var $=function(id){return document.getElementById(id)};
var st={size:25000,side:"YES",mode:"cts"};
function money(c){ // c in cents (integer or float)
  var neg=c<0; c=Math.abs(Math.round(c));
  var s="$"+Math.floor(c/100).toLocaleString("en-US")+"."+String(c%100).padStart(2,"0");
  return (neg?"−":"")+s;
}
function moneyShort(c){var v=Math.round(c); return v%100===0? "$"+(v/100).toLocaleString("en-US") : money(v);}
function num(id){var v=parseFloat($(id).value); return isFinite(v)?v:null;}
function esc(s){return String(s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}
function quote(text,page,url){return '<q>“'+esc(text)+'” <a href="'+url+'" target="_blank" rel="noopener">'+page+' page ↗</a></q>';}

function compute(){
  var size=st.size;
  var balRaw=num("bal"); var bal=(balRaw&&balRaw>0)?balRaw:size;
  var balC=Math.round(bal*100);
  var pc=Math.round(num("price")||0); pc=Math.min(99,Math.max(1,pc));
  var q=num("qty"); q=(q&&q>0)?q:0;
  var n= st.mode==="cts" ? Math.floor(q) : Math.floor((Math.round(q*100))/pc + 1e-9);
  var expIn=num("exp"); var hasExp=expIn!==null && $("exp").value.trim()!=="";
  var expC=hasExp?Math.max(0,Math.round(expIn*100)):0;
  var mpIn=num("mp"); var hasMp=mpIn!==null && $("mp").value.trim()!=="";
  var mpC=hasMp?Math.round(mpIn*100):0;
  var boost=$("boost").checked;
  var yesEq= st.side==="YES"? pc : 100-pc;
  var costC=n*pc;                       // contracts × price, in cents
  var feeC=Math.ceil((7*n*pc*(100-pc))/10000 - 1e-9); // 0.07 × n × P × (1−P), rounded up to the cent
  var posCapC=balC*5/100, expCapC=balC*10/100;
  var targetC=size*100*10/100, consPct=boost?25:15, consCapC=targetC*consPct/100;
  var winC=n*(100-pc)-feeC;
  var maxPos=Math.floor(posCapC/pc+1e-9), roomC=Math.max(0,expCapC-expC), maxExp=Math.floor(roomC/pc+1e-9);
  var maxN=Math.min(maxPos,maxExp);
  var inBand= yesEq>=20 && yesEq<=80;
  var checks=[];
  // 1 price band
  var bandNums= st.side==="NO" ? ("NO at "+pc+"¢ is checked as YES "+yesEq+"¢ (100 − "+pc+")") : ("YES at "+pc+"¢");
  checks.push({id:"band",name:"Entry price 20¢–80¢",status: inBand?"pass":"fail",
    msg: inBand? "In range. You can open this." : (yesEq<20? "Too cheap: below 20¢ YES. Opening it would end your account." : "Too expensive: above 80¢ YES. Opening it would end your account."),
    nums: bandNums+". Allowed: 20¢ to 80¢ YES."+(inBand?"":" Closing a position is always allowed."),
    q: inBand? "Contracts must be priced between 20¢ and 80¢ at entry. A NO position at price p is checked as YES 100 − p." : "Opening positions in contracts priced below 20¢ or above 80¢ YES. (listed under account termination conditions)"});
  // 2 position
  var posOk=costC<=posCapC;
  checks.push({id:"pos",name:"Max position 5%",status: n===0?"info":(posOk?"pass":"fail"),
    msg: n===0? "Enter a size to check." : (posOk? "Within the cap." : "Too big: this position is over 5% of your balance."),
    nums: "This trade costs "+money(costC)+" · cap "+money(posCapC)+" (5% of "+moneyShort(balC)+")"+(n>0&&!posOk?" · over by "+money(costC-posCapC):"")+" · max "+maxPos.toLocaleString("en-US")+" contracts at "+pc+"¢",
    q: "No single position may exceed 5% of your current balance at entry."});
  // 3 exposure
  var totC=expC+costC, expOk=totC<=expCapC;
  checks.push({id:"exp",name:"Max total exposure 10%",status: n===0&&!hasExp?"info":(expOk?"pass":"fail"),
    msg: (n===0&&!hasExp)? "Enter a size to check." : (expOk? (hasExp?"Within the cap, counting your open positions.":"Within the cap, assuming nothing else is open.") : "Too much: your open positions plus this trade go over 10% of your balance."),
    nums: (hasExp? money(expC)+" open + ":"")+money(costC)+" this trade = "+money(totC)+" · cap "+money(expCapC)+(expOk?" · room left "+money(expCapC-totC):" · over by "+money(totC-expCapC)),
    q: "The combined value of all open positions cannot exceed 10% of balance."});
  // 4 consistency
  var cs, cmsg, cnums="Profit target "+moneyShort(targetC)+" (10% of "+moneyShort(size*100)+") · "+consPct+"% of it = "+money(consCapC)+" per market";
  if(!hasMp){
    cs="info"; cmsg="Enter your profit from this market to check. Going over raises your target; it never ends your account.";
    if(n>0) cnums+=" · if this trade wins it adds "+money(winC)+" (after fee)";
  } else if(mpC>consCapC){
    cs="warn"; cmsg="Over the limit: this market has made more than "+consPct+"% of your target, so Lenium raises your target. It doesn't end your account. The Rules page doesn't say by how much.";
    cnums+=" · you've made "+money(mpC)+" here, "+money(mpC-consCapC)+" over";
  } else if(n>0 && mpC+winC>consCapC){
    cs="warn"; cmsg="Heads-up: you're under the limit now, but if this trade wins, this market goes over it and your target rises. It doesn't end your account.";
    cnums+=" · now "+money(mpC)+" · if it wins "+money(mpC+winC);
  } else {
    cs="pass"; cmsg="Under the limit."+(n>0?" Still under it if this trade wins.":"");
    cnums+=" · now "+money(mpC)+(n>0?" · if it wins "+money(mpC+winC):"")+" · room "+money(consCapC-mpC);
  }
  checks.push({id:"cons",name:"Consistency "+consPct+"% per market",status:cs,msg:cmsg,nums:cnums,
    q:"No single market may contribute more than 15% of your profit target. Exceeding it raises the target. It never ends your account."});
  var anyFail=checks.some(function(c){return c.status==="fail"}), anyWarn=checks.some(function(c){return c.status==="warn"});
  return {size:size,bal:bal,balC:balC,pc:pc,n:n,yesEq:yesEq,costC:costC,feeC:feeC,winC:winC,maxN:maxN,maxPos:maxPos,maxExp:maxExp,inBand:inBand,
    expC:expC,hasExp:hasExp,mpC:mpC,hasMp:hasMp,targetC:targetC,consCapC:consCapC,posCapC:posCapC,expCapC:expCapC,checks:checks,
    verdict: n===0?"none":(anyFail?"fail":(anyWarn?"warn":"pass"))};
}

function render(){
  var r=compute();
  var hint="";
  if(st.mode==="usd") hint= r.n>0 ? "= "+r.n.toLocaleString("en-US")+" contracts at "+r.pc+"¢ ("+money(r.costC)+"), before the fee" : "Enter how much you want to spend on contracts.";
  $("qtyHint").textContent=hint;
  var V=$("verdict"); V.className="verdict "+(r.verdict==="none"?"":r.verdict);
  var map={pass:["✓","Allowed","Passes every rule checked here."],warn:["!","Allowed, with a warning","It passes the hard limits, but see the warning below."],fail:["✕","Not allowed","At least one rule says no. Details below."],none:["?","Enter a size","Add contracts or a $ amount to check the trade."]};
  var m=map[r.verdict]; $("vIc").textContent=m[0]; $("vTitle").textContent=m[1];
  var nf=r.checks.filter(function(c){return c.status==="fail"}).length;
  $("vSub").textContent= r.verdict==="fail" ? (nf===1?"1 rule fails. Details below.":nf+" rules fail. Details below.") : m[2];
  var lab={pass:"Pass",warn:"Warning",fail:"Fail",info:"Check"};
  $("checks").innerHTML=r.checks.map(function(c){
    return '<li class="ck '+c.status+'" data-rule="'+c.id+'" data-status="'+c.status+'"><div class="hd"><span class="name">'+esc(c.name)+'</span><span class="badge">'+lab[c.status]+'</span></div><p class="msg">'+esc(c.msg)+'</p><p class="nums">'+esc(c.nums)+'</p>'+quote(c.q,"Rules",RULES)+'</li>';
  }).join("");
  $("oMax").textContent=r.maxN.toLocaleString("en-US");
  $("oMaxS").textContent= !r.inBand ? "by size caps · but this price is outside 20–80¢" : (r.maxExp<r.maxPos ? "limited by the 10% exposure cap" : "limited by the 5% position cap");
  $("oFee").textContent=money(r.feeC);
  $("oFeeS").textContent="0.07 × "+r.n.toLocaleString("en-US")+" × "+(r.pc/100).toFixed(2)+" × "+((100-r.pc)/100).toFixed(2)+", rounded up";
  $("oCost").textContent=money(r.costC);
  $("oCostS").textContent=money(r.costC+r.feeC)+" with the fee";
  $("oWin").textContent=(r.winC>=0?"+":"")+money(r.winC);
  $("oWinS").textContent="profit after fee · pays "+money(r.n*100)+" ($1 each)";
  $("formula").innerHTML=
    "<p>Price check: YES uses its price; NO at p uses YES 100 − p. Pass if 20¢ ≤ price ≤ 80¢.</p>"+
    "<p>Position = contracts × entry price. Pass if ≤ 5% × current balance.</p>"+
    "<p>Exposure = open exposure + this position. Pass if ≤ 10% × current balance.</p>"+
    "<p>Max contracts = the lower of ⌊5% × balance ÷ price⌋ and ⌊(10% × balance − open exposure) ÷ price⌋.</p>"+
    "<p>Consistency limit = 15% (25% with the boost) × profit target; target = 10% of starting balance.</p>"+
    "<p>Fee = 0.07 × contracts × P × (1 − P), P in dollars, rounded up to the next cent per order. Source: Lenium's <a href='"+FEEPAGE+"' target='_blank' rel='noopener'>fee calculator</a>; the Rules page says a standard exchange taker fee is simulated on every fill.</p>"+
    "<p>If it wins = contracts × $1 − cost − fee.</p>";
  window.__lc.last=r;
}

function setSize(sz){
  st.size=sz;
  [].forEach.call(document.querySelectorAll("#sizes .chip"),function(b){b.setAttribute("aria-pressed",String(+b.dataset.size===sz))});
  $("bal").value=sz; render();
}
function setSide(s){st.side=s;$("sideYes").setAttribute("aria-pressed",String(s==="YES"));$("sideNo").setAttribute("aria-pressed",String(s==="NO"));render();}
function setMode(m){
  if(m===st.mode) return;
  var r=compute(); st.mode=m;
  [].forEach.call(document.querySelectorAll("#mode button"),function(b){b.setAttribute("aria-pressed",String(b.dataset.mode===m))});
  $("qtyPre").hidden= m!=="usd"; $("qtySuf").hidden= m==="usd";
  $("qty").setAttribute("aria-label", m==="usd"?"Dollar amount":"Number of contracts");
  $("qty").step = m==="usd"?"0.01":"1";
  $("qty").value = m==="usd" ? (r.costC/100) : r.n;
  render();
}
window.__lc={set:function(o){ // test hook
  if(o.size) setSize(o.size);
  if(o.bal!=null) $("bal").value=o.bal;
  if(o.side) setSide(o.side);
  if(o.mode) setMode(o.mode);
  if(o.price!=null){$("price").value=o.price;$("priceRange").value=o.price;}
  if(o.qty!=null) $("qty").value=o.qty;
  if(o.exp!==undefined) $("exp").value=o.exp===null?"":o.exp;
  if(o.mp!==undefined) $("mp").value=o.mp===null?"":o.mp;
  if(o.boost!=null) $("boost").checked=o.boost;
  render(); return window.__lc.last;
}};

document.addEventListener("click",function(e){
  var c=e.target.closest("#sizes .chip"); if(c){setSize(+c.dataset.size);return;}
  var m=e.target.closest("#mode button"); if(m){setMode(m.dataset.mode);return;}
});
$("sideYes").onclick=function(){setSide("YES")}; $("sideNo").onclick=function(){setSide("NO")};
$("price").addEventListener("input",function(){var v=Math.round(+this.value); if(v>=1&&v<=99) $("priceRange").value=v; render();});
$("price").addEventListener("blur",function(){var v=Math.round(+this.value); if(!(v>=1)) v=1; if(v>99) v=99; this.value=v; $("priceRange").value=v; render();});
$("priceRange").addEventListener("input",function(){$("price").value=this.value; render();});
["bal","qty","exp","mp"].forEach(function(id){$(id).addEventListener("input",render)});
$("boost").addEventListener("change",render);
render();
document.documentElement.setAttribute("data-ready","1");
})();
