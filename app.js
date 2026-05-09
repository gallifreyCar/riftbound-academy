const missions = [
  {
    tag: "任务 01",
    title: "选你的冠军",
    copy:
      "你的传奇冠军决定整套牌的颜色和打法。先别急着背全部规则，先回答一个问题：你想快攻、铺场，还是靠一个关键角色到处支援？",
    cards: ["Champion", "Unit", "Spell"],
  },
  {
    tag: "任务 02",
    title: "用符文付款",
    copy:
      "符文来自独立的 12 张符文牌堆。召出后它们在基地里，横置自己的获得资源技能来支付费用；横置后本回合不能再用同一张符文。",
    cards: ["符文牌堆", "活跃符文", "横置支付"],
  },
  {
    tag: "任务 03",
    title: "派单位上战场",
    copy:
      "单位默认以休眠状态进场，不能立刻支付标准移动费用。到你的开始阶段激活后，才能休眠它并从基地移动到战场。",
    cards: ["休眠进场", "激活", "标准移动"],
  },
  {
    tag: "任务 04",
    title: "抢到 8 分",
    copy:
      "得分主要来自两种方式：通过争夺建立战场控制叫 Conquer；开始阶段继续控制战场叫 Hold。1v1 通常先到 8 分获胜。",
    cards: ["Conquer", "Hold", "Win"],
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
  playerHandCountOverride: 0,
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
    text: "2 力单位。打出后先休眠进基地。",
  },
  {
    id: "trick",
    name: "精准指令",
    cost: 1,
    speed: "swift",
    text: "迅捷练习牌。法术对决开环时才演示。",
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
  zoneCounters.playerMainDeck.textContent = `主牌堆 ${practice.playerMainDeck}`;
  zoneCounters.playerRuneDeck.textContent = `符文牌堆 ${practice.playerRuneDeck}`;
  zoneCounters.playerDiscard.textContent = `弃牌堆 ${practice.playerDiscard}`;
  zoneCounters.playerBanish.textContent = `放逐区 ${practice.playerBanish}`;
  zoneCounters.playerHandCount.textContent = `手牌 ${practice.hand.length + practice.playerHandCountOverride}`;
  zoneCounters.playerRuneBank.innerHTML = renderRuneBank(practice.playerRunes, "你的符文");
  zoneCounters.opponentMainDeck.textContent = `主牌堆 ${practice.opponentMainDeck}`;
  zoneCounters.opponentRuneDeck.textContent = `符文牌堆 ${practice.opponentRuneDeck}`;
  zoneCounters.opponentDiscard.textContent = `弃牌堆 ${practice.opponentDiscard}`;
  zoneCounters.opponentBanish.textContent = `放逐区 ${practice.opponentBanish}`;
  zoneCounters.opponentHandCount.textContent = `手牌 ${practice.opponentHand}`;
  zoneCounters.opponentRuneBank.innerHTML = renderRuneBank(practice.opponentRunes, "对手符文");

  Object.entries(siteEls).forEach(([site, element]) => {
    element.slot.textContent = practice.sites[site].text;
    element.slot.className = `site-slot ${practice.sites[site].state}`;
    element.status.textContent = practice.sites[site].status;
  });

  practiceHand.innerHTML = practice.hand
    .map(
      (card) => `
        <button class="hand-card ${card.speed || ""}" data-card="${card.id}" ${practice.step !== 4 ? "disabled" : ""}>
          ${card.name}
          <span>费用 ${card.cost} · ${card.text}</span>
        </button>
      `,
    )
    .join("");

  practiceLog.innerHTML = practice.log.map((item) => `<li>${item}</li>`).join("");
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
    practice.phase = "开局";
    practice.playerMainDeck = 38;
    practice.opponentMainDeck = 36;
    practice.opponentHand = 4;
    practice.playerHandCountOverride = 2;
    practice.hand = structuredClone(practiceCards);
    practice.primary = "进入召出阶段";
    practice.coach = "传奇进传奇区，选定英雄进英雄区。双方主牌堆和符文牌堆洗切，各抽 4 张并按回合顺序调度最多 2 张；这里把另外两张手牌折叠成数量显示。";
    addPracticeLog("开局：传奇、英雄、主牌堆、符文牌堆放入各自区域；双方抽 4 并调度最多 2。");
  } else if (practice.step === 3) {
    practice.step = 4;
    practice.phase = "召出";
    practice.playerRuneDeck = 10;
    practice.playerRunes = makeRunes("player", 2);
    refreshAvailableRunes();
    practice.primary = "等待出牌";
    practice.coach = "召出阶段从符文牌堆召出 2 张符文，它们以活跃状态在基地里。点击手牌里的“皮城侦察兵”，会横置 1 张符文支付费用。";
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
    practice.primary = "迅捷窗口让过";
    practice.coach = "战斗先进入战斗法术对决。令战场进入争夺的对手是进攻方，并先获得焦点；在这个开环窗口，迅捷与反应都可以用。";
    addPracticeLog("战斗法术对决：确定进攻方与防守方。");
  } else if (practice.step === 14) {
    practice.step = 15;
    practice.phase = "结算链";
    practice.primary = "反应窗口让过";
    practice.coach = "假设对手打出一张迅捷法术，它进入结算链。此时从法术对决开环变成法术对决闭环，只有反应能继续响应；普通法术和标准移动都不能插进来。";
    addPracticeLog("时机：迅捷法术创建结算链；闭环状态只允许反应。");
  } else if (practice.step === 15) {
    practice.step = 16;
    practice.phase = "伤害";
    practice.primary = "判定结果";
    practice.coach = "双方各有 2 点战力，互相分配 2 点战斗伤害，然后同时造成。";
    addPracticeLog("战斗伤害：双方各分配并造成 2 点伤害。");
  } else if (practice.step === 16) {
    practice.step = 17;
    practice.phase = "结算";
    practice.primary = "完成练习";
    practice.sites.bridge = {
      text: "无单位",
      state: "",
      status: "开放 · 未受控制",
    };
    practice.playerDiscard = 1;
    practice.opponentDiscard = 1;
    practice.coach = "双方单位都受到致命伤害，没有单位存活，所以战斗无结果，战场变为未受控制。";
    addPracticeLog("战斗结果：双方都没有单位存活，战斗无结果，战场未受控制。");
  } else {
    practice.phase = "完成";
    practice.primary = "再打一把";
    practice.coach = "你已经跑完投骰、抽战场、召出符文、横置支付、休眠进场、激活后标准移动、迅捷/反应窗口、征服、据守和一次战斗。现在可以重开再熟一遍。";
    addPracticeLog("练习完成：对局核心骨架已经跑通。");
    practice.step = 0;
  }

  renderPractice();
}

function playPracticeCard(cardId) {
  if (practice.step !== 4) {
    return;
  }

  if (cardId !== "scout") {
    practice.coach = "这张牌先留着。现在要练的是打出单位、横置符文付款，并确认单位休眠进场。";
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
  if (practice.step === 4 && practice.benchState !== "rested") {
    practice.coach = "先从手牌打出“皮城侦察兵”，再继续。";
    renderPractice();
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
