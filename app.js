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
      "符文来自独立的符文牌堆。每回合拿到两张新符文，普通费用可以横置支付，更重的费用可能要把符文放回牌堆。",
    cards: ["Rune +1", "Rune +1", "Pay Cost"],
  },
  {
    tag: "任务 03",
    title: "派单位上战场",
    copy:
      "1v1 构筑对局有 2 个战场：你的战场和对手战场。把单位移动到对手战场可以发起 Conquer；守住自己的战场，到下个开始阶段可以 Hold。",
    cards: ["Your Field", "Enemy Field", "Conquer"],
  },
  {
    tag: "任务 04",
    title: "抢到 8 分",
    copy:
      "得分主要来自两种方式：攻下还没得过分的战场叫 Conquer；开始阶段继续控制战场叫 Hold。1v1 通常先到 8 分获胜。",
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
  enemyVisible: false,
  sites: {
    your: { text: "空", state: "" },
    enemy: { text: "空", state: "" },
  },
  hand: [],
  log: [],
  coach: "点击“开始对局”，系统会发给你一个固定起手，让你按顺序打完第一轮，并看见据守和战斗。",
  primary: "开始对局",
};

const practiceCards = [
  {
    id: "scout",
    name: "皮城侦察兵",
    cost: 1,
    text: "2 力单位。适合进攻对手战场。",
  },
  {
    id: "trick",
    name: "精准指令",
    cost: 1,
    text: "练习牌：本局先别打，保留给下回合。",
  },
];

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
const siteEls = {
  your: document.querySelector("#site-your"),
  enemy: document.querySelector("#site-enemy"),
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
  practiceRunes.textContent = practice.runes;
  coachCopy.textContent = practice.coach;
  practicePrimary.textContent = practice.primary;
  practiceUndo.disabled = practiceHistory.length === 0;

  playerBench.textContent = practice.bench;
  playerBench.classList.toggle("ready", practice.bench !== "等待发牌" && practice.bench !== "空");
  enemyCard.classList.toggle("hidden", !practice.enemyVisible);

  Object.entries(siteEls).forEach(([site, element]) => {
    element.textContent = practice.sites[site].text;
    element.className = `site-slot ${practice.sites[site].state}`;
  });

  practiceHand.innerHTML = practice.hand
    .map(
      (card) => `
        <button class="hand-card" data-card="${card.id}" ${practice.step !== 2 ? "disabled" : ""}>
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
    practice.phase = "资源";
    practice.runes = 2;
    practice.hand = structuredClone(practiceCards);
    practice.primary = "确认拿符文";
    practice.coach = "召出阶段从符文牌堆召出 2 张符文。下一步打出 1 费单位，系统会自动支付。";
    addPracticeLog("召出：获得 2 个符文，并抽到两张练习牌。");
  } else if (practice.step === 1) {
    practice.step = 2;
    practice.phase = "部署";
    practice.primary = "等待出牌";
    practice.coach = "点击手牌里的“皮城侦察兵”。先别打指令牌，练习目标是派单位去对手战场发起 Conquer。";
    addPracticeLog("资源确认：这回合可以支付 2 点费用。");
  } else if (practice.step === 3) {
    practice.step = 4;
    practice.phase = "行动";
    practice.primary = "进攻对手战场";
    practice.coach = "单位已经在后场。现在把它派到对手战场。若对手没有单位防守，你会建立控制并通过 Conquer 得分。";
    addPracticeLog("部署完成：皮城侦察兵进入你的后场。");
  } else if (practice.step === 4) {
    practice.step = 5;
    practice.phase = "战场";
    practice.primary = "结算 Conquer";
    practice.bench = "空";
    practice.sites.enemy = { text: "皮城侦察兵控制", state: "controlled" };
    practice.coach = "对手战场没有单位防守，你建立控制。点击结算 Conquer，本回合拿到 1 分。";
    addPracticeLog("移动：皮城侦察兵进入对手战场，发起争夺。");
  } else if (practice.step === 5) {
    practice.step = 6;
    practice.phase = "得分";
    practice.primary = "进入下回合";
    practice.score = 1;
    practice.coach = "你通过 Conquer 对手战场获得 1 分。只要下一次开始阶段仍控制它，就能通过 Hold 再得分。";
    addPracticeLog("结算：Conquer 对手战场，得 1 分。");
  } else if (practice.step === 6) {
    practice.step = 7;
    practice.phase = "开始阶段";
    practice.primary = "对手行动";
    practice.score = 2;
    practice.coach = "下一回合开始阶段，你仍控制对手战场，所以通过 Hold 得 1 分。";
    addPracticeLog("据守：开始阶段仍控制对手战场，得 1 分。");
  } else if (practice.step === 7) {
    practice.step = 8;
    practice.phase = "对手";
    practice.primary = "开始战斗";
    practice.enemyVisible = false;
    practice.sites.enemy = { text: "皮城侦察兵防守 / 敌方单位进攻", state: "contested" };
    practice.coach = "对手把单位移动到你控制的对手战场。同一战场出现敌对单位，战场进入争夺并标记待发生战斗。";
    addPracticeLog("对手行动：敌方单位移动到你控制的战场，发起争夺。");
  } else if (practice.step === 8) {
    practice.step = 9;
    practice.phase = "战斗";
    practice.primary = "分配伤害";
    practice.coach = "战斗先进入战斗法术对决：令战场进入争夺的对手是进攻方，你是防守方。";
    addPracticeLog("战斗法术对决：确定进攻方与防守方。");
  } else if (practice.step === 9) {
    practice.step = 10;
    practice.phase = "伤害";
    practice.primary = "判定结果";
    practice.coach = "双方各有 2 点战力，互相分配 2 点战斗伤害，然后同时造成。";
    addPracticeLog("战斗伤害：双方各分配并造成 2 点伤害。");
  } else if (practice.step === 10) {
    practice.step = 11;
    practice.phase = "结算";
    practice.primary = "完成练习";
    practice.sites.enemy = { text: "双方单位被摧毁 / 战场未受控制", state: "" };
    practice.coach = "双方单位都受到致命伤害，没有单位存活，所以战斗无结果，战场变为未受控制。";
    addPracticeLog("战斗结果：双方都没有单位存活，战斗无结果，战场未受控制。");
  } else {
    practice.phase = "完成";
    practice.primary = "再打一把";
    practice.coach = "你已经跑完资源、部署、移动、征服、据守和一次简化战斗。现在可以重开再熟一遍。";
    addPracticeLog("练习完成：对局核心骨架已经跑通。");
    practice.step = 0;
  }

  renderPractice();
}

function playPracticeCard(cardId) {
  if (practice.step !== 2) {
    return;
  }

  if (cardId !== "scout") {
    practice.coach = "这张牌先留着。现在要练的是打出单位并进攻对手战场。";
    renderPractice();
    return;
  }

  savePractice();
  practice.step = 3;
  practice.runes -= 1;
  practice.hand = practice.hand.filter((card) => card.id !== cardId);
  practice.bench = "皮城侦察兵 2 力";
  practice.primary = "完成部署";
  practice.coach = "自动支付 1 个符文，单位进入后场。下一步点击“完成部署”。";
  addPracticeLog("自动支付：横置 1 个符文，打出皮城侦察兵。");
  renderPractice();
}

practicePrimary.addEventListener("click", () => {
  if (practice.step === 2) {
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
