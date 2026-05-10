const missions = [
  {
    tag: "任务 01",
    title: "认识你的卡牌",
    copy:
      "先把桌面搭出来：选定英雄是可以按规则打出的“身子”，传奇是提供符文特性和技能的“头”，主牌堆、符文牌堆、废牌堆各自分开放。",
    cards: ["选定英雄", "传奇", "主牌堆"],
  },
  {
    tag: "任务 02",
    title: "回合开始",
    copy:
      "你的回合先唤醒：横放的单位和符文正放。然后据守已控制战场，再从 12 张符文牌堆召出 2 张符文，抽 1 张牌并清空符文池。",
    cards: ["唤醒", "据守", "召出符文"],
  },
  {
    tag: "任务 03",
    title: "占领=得分",
    copy:
      "单位默认休眠进基地。下一回合变活跃后，标准移动要横置它作为费用；进入你不控制的战场后，法术对决结束再确立控制并征服得分。",
    cards: ["休眠进场", "标准移动", "征服"],
  },
  {
    tag: "任务 04",
    title: "战斗对决",
    copy:
      "敌方单位进入你控制的战场会待发生战斗。战斗先开法术对决，迅捷和反应可以在开环行动；有结算链时只剩反应能响应。",
    cards: ["进攻方", "迅捷", "反应"],
  },
  {
    tag: "任务 05",
    title: "据守再得分",
    copy:
      "如果下个自己的开始阶段仍控制某战场，就通过据守得 1 分。每回合每个战场最多给同一玩家 1 分。",
    cards: ["控制", "开始阶段", "据守"],
  },
  {
    tag: "任务 06",
    title: "夺取最终胜利",
    copy:
      "1v1 到 8 分获胜。最后一分要注意：据守可以直接赢；征服拿最后一分时，本回合需要每个战场都得过分，否则改为抽 1 张牌。",
    cards: ["7 / 8", "致胜分", "获胜"],
  },
];

const missionButtons = document.querySelectorAll(".mission");
const missionTag = document.querySelector("#mission-tag");
const missionTitle = document.querySelector("#mission-title");
const missionCopy = document.querySelector("#mission-copy");
const missionBoard = document.querySelector("#mission-board");

function renderMission(index) {
  const mission = missions[index];
  missionTag.textContent = mission.tag;
  missionTitle.textContent = mission.title;
  missionCopy.textContent = mission.copy;
  missionBoard.innerHTML = mission.cards
    .map((card, cardIndex) => {
      const styles = ["champion", "unit", "spell"];
      return `<div class="demo-card ${styles[cardIndex]}">${card}</div>`;
    })
    .join("");

  missionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mission === String(index));
  });
}

missionButtons.forEach((button) => {
  button.addEventListener("click", () => renderMission(Number(button.dataset.mission)));
});

document.querySelectorAll(".answers button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".answers button").forEach((item) => {
      item.classList.remove("selected");
    });
    button.classList.add("selected");
    const feedback = document.querySelector("#feedback");
    const isCorrect = button.dataset.correct === "true";
    feedback.textContent = isCorrect
      ? "正确。先到 8 分就是 1v1 的核心目标。"
      : "再想想：团队战是 11 分，1v1 的目标更低。";
  });
});

const initialPractice = {
  step: 0,
  phase: "准备",
  score: 0,
  runes: 0,
  bench: "等待发牌",
  benchState: "empty",
  playerMainDeck: 40,
  playerRuneDeck: 12,
  playerRunes: [],
  playerDiscard: 0,
  playerBanish: 0,
  mulliganSelection: [],
  mulliganConfirmed: false,
  opponentMainDeck: 40,
  opponentRuneDeck: 12,
  opponentRunes: [],
  opponentDiscard: 0,
  opponentBanish: 0,
  opponentHand: 0,
  enemyVisible: false,
  sites: {
    arena: { text: "无单位", state: "", status: "开放 · 未受控制" },
    bridge: { text: "无单位", state: "", status: "开放 · 未受控制" },
  },
  hand: [],
  log: [],
  coach: "点击“开始准备”，先投骰决定先后手，再由双方互抽对方提供的战场。",
  primary: "开始准备",
};

const practiceCards = [
  {
    id: "scout",
    name: "皮城侦察兵",
    cost: 1,
    kind: "unit",
    text: "2 力单位。打出后先休眠进基地。",
  },
  {
    id: "trick",
    name: "精准指令",
    cost: 1,
    kind: "spell",
    speed: "swift",
    text: "迅捷练习牌。法术对决开环时打出。",
  },
  {
    id: "dragon",
    name: "熔浆巨龙",
    cost: 8,
    kind: "unit",
    mulliganTarget: true,
    text: "高费单位。起手太重，调度换掉。",
  },
  {
    id: "breaker",
    name: "裂浪者前锋",
    cost: 10,
    kind: "unit",
    mulliganTarget: true,
    text: "高费单位。先搁置，抽同数量补回。",
  },
];

const replacementPracticeCards = [
  {
    id: "spark",
    name: "爆破火花",
    cost: 1,
    kind: "spell",
    text: "调度补回。留作低费选择。",
  },
  {
    id: "guard",
    name: "码头守卫",
    cost: 2,
    kind: "unit",
    text: "调度补回。低费单位更适合开局。",
  },
];

function makeRunes(prefix, count, state = "active") {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    state,
  }));
}

function countRunes(runes, state) {
  return runes.filter((rune) => rune.state === state).length;
}

function renderRuneBank(runes, label) {
  if (runes.length === 0) {
    return `
      <span>${label}</span>
      <strong>已召出符文 0</strong>
      <div class="rune-row empty">无符文在场</div>
    `;
  }

  const active = countRunes(runes, "active");
  const rested = countRunes(runes, "rested");
  const tokens = runes
    .map((rune, index) => {
      const stateText = rune.state === "active" ? "活跃" : "休眠";
      return `<i class="rune-token ${rune.state}" title="符文 ${index + 1}：${stateText}">${stateText}</i>`;
    })
    .join("");

  return `
    <span>${label}</span>
    <strong>活跃 ${active} / 休眠 ${rested}</strong>
    <div class="rune-row">${tokens}</div>
  `;
}

function refreshAvailableRunes() {
  practice.runes = countRunes(practice.playerRunes, "active");
}

function restPlayerRunes(count) {
  let remaining = count;
  practice.playerRunes = practice.playerRunes.map((rune) => {
    if (remaining > 0 && rune.state === "active") {
      remaining -= 1;
      return { ...rune, state: "rested" };
    }
    return rune;
  });
  refreshAvailableRunes();
}

function readyAllControlledObjects() {
  practice.playerRunes = practice.playerRunes.map((rune) => ({ ...rune, state: "active" }));
  if (practice.benchState === "rested") {
    practice.benchState = "ready";
    practice.bench = "皮城侦察兵 2 力 · 活跃";
  }
  refreshAvailableRunes();
}

function recyclePlayerRunes(count) {
  let remaining = count;
  const keptRunes = [];

  practice.playerRunes.forEach((rune) => {
    if (remaining > 0 && rune.state === "rested") {
      remaining -= 1;
      practice.playerRuneDeck += 1;
      return;
    }
    keptRunes.push(rune);
  });

  practice.playerRunes = keptRunes;
  refreshAvailableRunes();
}

let practice = structuredClone(initialPractice);
let practiceHistory = [];

const practicePhase = document.querySelector("#practice-phase");
const practiceScore = document.querySelector("#practice-score");
const practiceRunes = document.querySelector("#practice-runes");
const coachCopy = document.querySelector("#coach-copy");
const practicePrimary = document.querySelector("#practice-primary");
const practiceUndo = document.querySelector("#practice-undo");
const practiceReset = document.querySelector("#practice-reset");
const practiceHand = document.querySelector("#practice-hand");
const practiceLog = document.querySelector("#practice-log");
const playerBench = document.querySelector("#player-bench");
const enemyCard = document.querySelector("#enemy-card");
const scoreMarkers = document.querySelectorAll(".score-track [data-score]");
const zoneCounters = {
  playerMainDeck: document.querySelector("#player-main-deck"),
  playerRuneDeck: document.querySelector("#player-rune-deck"),
  playerDiscard: document.querySelector("#player-discard"),
  playerBanish: document.querySelector("#player-banish"),
  playerHandCount: document.querySelector("#player-hand-count"),
  playerRuneBank: document.querySelector("#player-rune-bank"),
  opponentMainDeck: document.querySelector("#opponent-main-deck"),
  opponentRuneDeck: document.querySelector("#opponent-rune-deck"),
  opponentDiscard: document.querySelector("#opponent-discard"),
  opponentBanish: document.querySelector("#opponent-banish"),
  opponentHandCount: document.querySelector("#opponent-hand-count"),
  opponentRuneBank: document.querySelector("#opponent-rune-bank"),
};
const siteEls = {
  arena: {
    slot: document.querySelector("#site-arena"),
    status: document.querySelector("#state-arena"),
  },
  bridge: {
    slot: document.querySelector("#site-bridge"),
    status: document.querySelector("#state-bridge"),
  },
};

function savePractice() {
  practiceHistory.push(structuredClone(practice));
  practiceUndo.disabled = false;
}

function addPracticeLog(text) {
  practice.log.unshift(text);
}

function renderPracticeCard(card) {
  return `
    <button class="hand-card ${card.kind || ""} ${card.speed || ""} ${practice.mulliganSelection.includes(card.id) ? "selected" : ""}" data-card="${card.id}" ${canPlayPracticeCard(card.id) ? "" : "disabled"}>
      ${card.name}
      <span>${practice.mulliganSelection.includes(card.id) ? "待替换 · " : ""}费用 ${card.cost} · ${card.text}</span>
    </button>
  `;
}

function renderMulliganHand() {
  const selectedCards = getSelectedMulliganCards();
  const cardsInHand = practice.hand.filter((card) => !practice.mulliganSelection.includes(card.id));
  const emptySlots = Array.from({ length: 2 - selectedCards.length }, (_, index) => `<div class="mulligan-empty">空槽 ${index + 1}</div>`).join("");

  return `
    <div class="mulligan-stage">
      <div class="mulligan-tray" aria-label="调度区">
        <span>调度区 ${selectedCards.length} / 2</span>
        <div class="mulligan-row">${selectedCards.map(renderPracticeCard).join("")}${emptySlots}</div>
      </div>
      <div class="mulligan-hand" aria-label="起手手牌">
        <span>起手手牌</span>
        <div class="mulligan-row">${cardsInHand.map(renderPracticeCard).join("")}</div>
      </div>
    </div>
  `;
}

function renderPractice() {
  practicePhase.textContent = practice.phase;
  practiceScore.textContent = `${practice.score} / 8`;
  refreshAvailableRunes();
  practiceRunes.textContent = practice.runes;
  coachCopy.textContent = practice.coach;
  practicePrimary.textContent = practice.primary;
  practiceUndo.disabled = practiceHistory.length === 0;

  playerBench.textContent = practice.bench;
  playerBench.className = `bench ${practice.benchState}`;
  enemyCard.classList.toggle("hidden", !practice.enemyVisible);
  scoreMarkers.forEach((marker) => {
    marker.classList.toggle("earned", Number(marker.dataset.score) <= practice.score);
  });
  zoneCounters.playerMainDeck.textContent = `主牌堆 ${practice.playerMainDeck}`;
  zoneCounters.playerRuneDeck.textContent = `符文牌堆 ${practice.playerRuneDeck}`;
  zoneCounters.playerDiscard.textContent = `废牌堆 ${practice.playerDiscard}`;
  zoneCounters.playerBanish.textContent = `放逐区 ${practice.playerBanish}`;
  zoneCounters.playerHandCount.textContent = `手牌 ${practice.hand.length}`;
  zoneCounters.playerRuneBank.innerHTML = renderRuneBank(practice.playerRunes, "你的符文");
  zoneCounters.opponentMainDeck.textContent = `主牌堆 ${practice.opponentMainDeck}`;
  zoneCounters.opponentRuneDeck.textContent = `符文牌堆 ${practice.opponentRuneDeck}`;
  zoneCounters.opponentDiscard.textContent = `废牌堆 ${practice.opponentDiscard}`;
  zoneCounters.opponentBanish.textContent = `放逐区 ${practice.opponentBanish}`;
  zoneCounters.opponentHandCount.textContent = `手牌 ${practice.opponentHand}`;
  zoneCounters.opponentRuneBank.innerHTML = renderRuneBank(practice.opponentRunes, "对手符文");

  Object.entries(siteEls).forEach(([site, element]) => {
    element.slot.textContent = practice.sites[site].text;
    element.slot.className = `site-slot ${practice.sites[site].state}`;
    element.status.textContent = practice.sites[site].status;
  });

  practiceHand.innerHTML =
    practice.step === 3 && !practice.mulliganConfirmed
      ? renderMulliganHand()
      : practice.hand.map(renderPracticeCard).join("");

  practiceLog.innerHTML = practice.log.map((item) => `<li>${item}</li>`).join("");
}

function canPlayPracticeCard(cardId) {
  if (practice.step === 3 && !practice.mulliganConfirmed) {
    return practice.hand.some((card) => card.id === cardId);
  }
  if (cardId === "scout") {
    return practice.step === 4 && practice.benchState !== "rested";
  }
  if (cardId === "trick") {
    return practice.step === 14;
  }
  return false;
}

function getSelectedMulliganCards() {
  return practice.hand.filter((card) => practice.mulliganSelection.includes(card.id));
}

function toggleMulliganCard(cardId) {
  const card = practice.hand.find((item) => item.id === cardId);
  if (!card || practice.step !== 3) {
    return;
  }

  savePractice();

  if (practice.mulliganSelection.includes(cardId)) {
    practice.mulliganSelection = practice.mulliganSelection.filter((id) => id !== cardId);
  } else if (practice.mulliganSelection.length < 2) {
    practice.mulliganSelection = [...practice.mulliganSelection, cardId];
  } else {
    practice.coach = "调度最多选择 2 张牌。先取消一张，再选择另一张。";
  }

  const selectedNames = getSelectedMulliganCards()
    .map((item) => item.name)
    .join("、");
  if (selectedNames) {
    practice.coach = `已搁置：${selectedNames}。小程序教学里会把选中的不满意手牌移到调度槽；这里选满两张后点“确认替换”。`;
  }

  renderPractice();
}

function confirmMulligan() {
  const selectedCards = getSelectedMulliganCards();
  const targetIds = practiceCards.filter((card) => card.mulliganTarget).map((card) => card.id);
  const selectedIds = selectedCards.map((card) => card.id);
  const selectedTargetCards = targetIds.every((id) => selectedIds.includes(id));

  if (selectedCards.length !== 2 || !selectedTargetCards) {
    practice.coach = "请像小程序教学那样，选择两张明显不适合起手的高费牌：熔浆巨龙和裂浪者前锋，然后再确认替换。";
    renderPractice();
    return false;
  }

  savePractice();
  practice.hand = [
    ...practice.hand.filter((card) => !practice.mulliganSelection.includes(card.id)),
    ...structuredClone(replacementPracticeCards),
  ];
  practice.mulliganSelection = [];
  practice.mulliganConfirmed = true;
  practice.phase = "调度完成";
  practice.playerMainDeck = 36;
  practice.primary = "进入召出阶段";
  practice.coach = "调度完成：你搁置 2 张高费牌，抽 2 张补回，最后把搁置牌回收至主牌堆底。主牌堆仍是 36 张，手牌保持 4 张。";
  addPracticeLog("调度：搁置熔浆巨龙、裂浪者前锋，抽 2 张补回，再回收被搁置的牌到主牌堆底。");
  renderPractice();
  return true;
}

function advancePractice() {
  savePractice();

  if (practice.step === 0) {
    practice.step = 1;
    practice.phase = "投骰";
    practice.primary = "抽取战场";
    practice.coach = "投骰只决定先手后手和回合顺序。脚本里你投出高点并成为起始玩家；第二个行动的玩家会在自己首个召出阶段额外召出 1 张符文。";
    addPracticeLog("投骰：你获得先手。对手作为第二行动玩家，首个召出阶段会额外召出 1 张符文。");
  } else if (practice.step === 1) {
    practice.step = 2;
    practice.phase = "抽战场";
    practice.primary = "布置起手";
    practice.coach = "战场不是投骰决定，也不是自己抽自己的。1v1 中你从对手提供的 3 张战场里随机抽 1 张；对手从你提供的 3 张里随机抽 1 张。两张战场同时放入同一个战场区域。";
    addPracticeLog("互抽战场：你从对手的 3 张里抽到荣耀竞技场；对手从你的 3 张里抽到河道渡口。");
  } else if (practice.step === 2) {
    practice.step = 3;
    practice.phase = "调度";
    practice.playerMainDeck = 36;
    practice.opponentMainDeck = 36;
    practice.opponentHand = 4;
    practice.mulliganSelection = [];
    practice.mulliganConfirmed = false;
    practice.hand = structuredClone(practiceCards);
    practice.primary = "确认替换";
    practice.coach = "传奇进传奇区，选定英雄进英雄区。双方洗切并各抽 4 张。现在实际调度：点击两张不满意的高费手牌“熔浆巨龙”和“裂浪者前锋”，再确认替换。";
    addPracticeLog("开局：传奇、英雄、主牌堆、12 张符文牌堆放入各自区域；双方各抽 4 张。");
  } else if (practice.step === 3) {
    practice.step = 4;
    practice.phase = "召出";
    practice.playerRuneDeck = 10;
    practice.playerRunes = makeRunes("player", 2);
    refreshAvailableRunes();
    practice.primary = "等待出牌";
    practice.coach = "召出阶段从符文牌堆顶部召出 2 张符文，放进基地并保持活跃。点击手牌里的“皮城侦察兵”，会横置 1 张符文支付费用。";
    addPracticeLog("召出：从 12 张符文牌堆召出 2 张符文，放入基地并保持活跃。");
  } else if (practice.step === 4) {
    practice.step = 5;
    practice.phase = "部署后";
    practice.primary = "结束本回合";
    practice.coach = "单位默认休眠进场，所以它这回合不能支付标准移动费用。把它留在你的基地，等下一次你的开始阶段激活。";
    addPracticeLog("部署检查：皮城侦察兵以休眠状态进场，不能立刻标准移动。");
  } else if (practice.step === 5) {
    practice.step = 6;
    practice.phase = "对手首回合";
    practice.primary = "进入你的开始阶段";
    practice.opponentRuneDeck = 9;
    practice.opponentRunes = makeRunes("opponent", 3);
    practice.coach = "对手是第二个行动的玩家，因此首个召出阶段召出 3 张符文：基础 2 张，加上首回合流程额外 1 张。这里对手暂不进攻，让你练到下回合激活。";
    addPracticeLog("对手首回合：第二行动玩家首个召出阶段额外召出 1 张符文，共 3 张。");
  } else if (practice.step === 6) {
    practice.step = 7;
    practice.phase = "你的开始阶段";
    practice.primary = "标准移动";
    readyAllControlledObjects();
    practice.coach = "开始阶段的激活步骤把你控制的非法术游戏物体激活：休眠单位正放，横置符文也正放。现在侦察兵可以支付标准移动费用。";
    addPracticeLog("激活：你的休眠单位和休眠符文变为活跃。");
  } else if (practice.step === 7) {
    practice.step = 8;
    practice.phase = "主阶段";
    practice.primary = "开启法术对决";
    practice.bench = "空";
    practice.benchState = "empty";
    practice.sites.bridge = {
      text: "皮城侦察兵 2 力 · 休眠",
      state: "controlled rested-card",
      status: "被占领 · 争夺待结算",
    };
    practice.coach = "标准移动的费用是让单位休眠。侦察兵从你的基地移动到战场 B 后横置，战场进入争夺，并标记一场非战斗法术对决。";
    addPracticeLog("标准移动：侦察兵休眠作为费用，从基地移动到战场 B。");
  } else if (practice.step === 8) {
    practice.step = 9;
    practice.phase = "法术对决";
    practice.primary = "让过并确立控制";
    practice.coach = "现在处于法术对决开环。只有带迅捷或反应的法术/技能能在这里打出或激活；如果有结算链，就会变成闭环，只剩反应能继续响应。双方都让过后，对决关闭。";
    addPracticeLog("法术对决：移动到开放战场后开启。焦点从令战场进入争夺的玩家开始。");
  } else if (practice.step === 9) {
    practice.step = 10;
    practice.phase = "征服";
    practice.primary = "结算得分";
    practice.sites.bridge = {
      text: "皮城侦察兵 2 力 · 休眠",
      state: "controlled rested-card",
      status: "被占领 · 控制者：你",
    };
    practice.coach = "非战斗法术对决结束后，如果只剩你的单位在该战场，你确立控制。因为本回合还没有通过这个战场得分，所以这次控制变化视为征服。";
    addPracticeLog("控制：你建立对战场 B 的控制。战场提供者不因控制权变化而改变。");
  } else if (practice.step === 10) {
    practice.step = 11;
    practice.phase = "得分";
    practice.primary = "进入下回合";
    practice.score = 1;
    practice.coach = "征服会让你获得最多 1 分，并触发该战场上的征服技能。下一回合如果仍控制此战场，就能据守得分。";
    addPracticeLog("征服：通过战场 B 得 1 分。");
  } else if (practice.step === 11) {
    practice.step = 12;
    practice.phase = "开始阶段";
    practice.primary = "对手行动";
    practice.sites.bridge = {
      text: "皮城侦察兵 2 力 · 活跃",
      state: "controlled",
      status: "被占领 · 控制者：你",
    };
    practice.score = 2;
    readyAllControlledObjects();
    practice.coach = "又到你的开始阶段，单位会激活。得分计算步骤中，你仍控制战场 B，因此通过据守得 1 分。";
    addPracticeLog("据守：开始阶段仍控制战场 B，得 1 分。");
  } else if (practice.step === 12) {
    practice.step = 13;
    practice.phase = "对手";
    practice.primary = "开始战斗";
    practice.enemyVisible = false;
    practice.sites.bridge = {
      text: "防守：侦察兵 2 力 / 进攻：敌方单位 2 力",
      state: "contested",
      status: "被占领 · 正在争夺",
    };
    practice.coach = "对手让单位进入你控制的战场 B。因为同一战场出现敌对单位，战场进入争夺并标记待发生战斗。";
    addPracticeLog("对手行动：敌方单位进入战场 B。该战场进入争夺，并待发生战斗。");
  } else if (practice.step === 13) {
    practice.step = 14;
    practice.phase = "战斗";
    practice.primary = "等待迅捷法术";
    practice.coach = "战斗先进入战斗法术对决。令战场进入争夺的对手是进攻方，并先获得焦点；焦点传给你时，点击手牌里的“精准指令”练习迅捷窗口。";
    addPracticeLog("战斗法术对决：确定进攻方与防守方，进攻方先获得焦点。");
  } else if (practice.step === 14) {
    practice.coach = "先点击手牌里的“精准指令”。迅捷法术要在法术对决开环、有焦点时打出；它进入结算链后才会变成闭环。";
  } else if (practice.step === 15) {
    practice.step = 16;
    practice.phase = "伤害";
    practice.primary = "判定结果";
    practice.playerDiscard += 1;
    practice.coach = "双方各有 2 点战力，互相分配 2 点战斗伤害，然后同时造成。";
    addPracticeLog("结算：精准指令结算完毕，放入你的废牌堆。");
    addPracticeLog("战斗伤害：双方各分配并造成 2 点伤害。");
  } else if (practice.step === 16) {
    practice.step = 17;
    practice.phase = "结算";
    practice.primary = "练习回收";
    practice.sites.bridge = {
      text: "无单位",
      state: "",
      status: "开放 · 未受控制",
    };
    practice.playerDiscard += 1;
    practice.opponentDiscard += 1;
    practice.coach = "双方单位都受到致命伤害，没有单位存活，所以战斗无结果，战场变为未受控制。";
    addPracticeLog("战斗结果：双方都没有单位存活，战斗无结果，战场未受控制。");
  } else if (practice.step === 17) {
    practice.step = 18;
    practice.phase = "回收";
    practice.primary = "模拟最后一分";
    recyclePlayerRunes(1);
    practice.coach = "回收不是进废牌堆。这里把 1 张已横置符文作为示例回收到符文牌堆底：符文区减少 1，符文牌堆增加 1。";
    addPracticeLog("回收：1 张休眠符文回到符文牌堆底。");
  } else if (practice.step === 18) {
    practice.step = 19;
    practice.phase = "最终胜利";
    practice.primary = "完成练习";
    practice.score = 7;
    practice.sites.arena = {
      text: "友方单位 2 力 · 活跃",
      state: "controlled",
      status: "被占领 · 控制者：你",
    };
    practice.sites.bridge = {
      text: "友方单位 2 力 · 活跃",
      state: "controlled",
      status: "被占领 · 控制者：你",
    };
    practice.coach = "假设你已经 7 / 8，并同时控制两个战场。下一次开始阶段通过据守得分时，可以直接拿到致胜分。若靠征服拿最后一分，则本回合必须每个战场都得过分，否则改为抽 1 张牌。";
    addPracticeLog("致胜分：据守可直接拿最后一分；征服最后一分有额外条件。");
  } else {
    practice.step = 20;
    practice.phase = "完成";
    practice.primary = "再打一把";
    practice.score = 8;
    practice.coach = "你已经跑完投骰、抽战场、召出符文、横置支付、休眠进场、激活后标准移动、迅捷/反应窗口、征服、据守、战斗、回收和最后一分。现在可以重开再熟一遍。";
    addPracticeLog("练习完成：对局核心骨架已经跑通。");
  }

  renderPractice();
}

function playPracticeCard(cardId) {
  if (!canPlayPracticeCard(cardId)) {
    return;
  }

  if (practice.step === 3 && !practice.mulliganConfirmed) {
    toggleMulliganCard(cardId);
    return;
  }

  if (cardId === "trick") {
    savePractice();
    restPlayerRunes(1);
    practice.hand = practice.hand.filter((card) => card.id !== cardId);
    practice.step = 15;
    practice.phase = "结算链";
    practice.primary = "反应窗口让过";
    practice.coach = "你在法术对决开环打出迅捷法术，并横置 1 张符文支付费用。法术进入结算链后变成法术对决闭环，此时只有反应能继续响应；双方让过后按后进先出结算，法术进废牌堆。";
    addPracticeLog("迅捷：打出精准指令，横置 1 张符文支付；进入闭环后只剩反应可响应。");
    renderPractice();
    return;
  }

  savePractice();
  practice.step = 4;
  restPlayerRunes(1);
  practice.hand = practice.hand.filter((card) => card.id !== cardId);
  practice.bench = "皮城侦察兵 2 力 · 休眠";
  practice.benchState = "rested";
  practice.primary = "检查休眠";
  practice.coach = "自动横置 1 张活跃符文获得资源并支付费用。皮城侦察兵打出到你的基地，并以休眠状态进场，所以本回合不能标准移动。";
  addPracticeLog("支付：横置 1 张符文获得 1 点资源，并打出皮城侦察兵到基地。");
  renderPractice();
}

practicePrimary.addEventListener("click", () => {
  if (practice.step === 20) {
    practice = structuredClone(initialPractice);
    practiceHistory = [];
    renderPractice();
    return;
  }
  if (practice.step === 4 && practice.benchState !== "rested") {
    practice.coach = "先从手牌打出“皮城侦察兵”，再继续。";
    renderPractice();
    return;
  }
  if (practice.step === 14) {
    practice.coach = "这里要实际练一次时机窗口：请点击手牌里的“精准指令”，它是迅捷法术。";
    renderPractice();
    return;
  }
  if (practice.step === 3 && !practice.mulliganConfirmed) {
    confirmMulligan();
    return;
  }
  advancePractice();
});

practiceHand.addEventListener("click", (event) => {
  const cardButton = event.target.closest("[data-card]");
  if (!cardButton) {
    return;
  }
  playPracticeCard(cardButton.dataset.card);
});

practiceUndo.addEventListener("click", () => {
  const previous = practiceHistory.pop();
  if (!previous) {
    return;
  }
  practice = previous;
  renderPractice();
});

practiceReset.addEventListener("click", () => {
  practice = structuredClone(initialPractice);
  practiceHistory = [];
  renderPractice();
});

renderPractice();
