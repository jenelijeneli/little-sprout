// The quest board.
import { icon } from '../assets/index.js';
import { QUESTS } from '../data/questsData.js';
import { activeQuestIds, questProgress } from '../systems/quests.js';
import { esc, meter, rewardChips } from './ui.js';

export const questPanel = {
  id: 'quests',
  title: 'Quest Board',
  icon: 'quest',
  render(game) {
    const s = game.state;
    const ids = activeQuestIds(s);
    const done = QUESTS.filter((q) => s.quests[q.id]?.claimed).length;
    const cards = ids.map((id) => {
      const { quest, progress, complete } = questProgress(s, id);
      return `<li class="card quest ${complete ? 'complete' : ''}">
        ${icon(complete ? 'sparkle' : 'quest', 'card-art small')}
        <div class="card-body">
          <strong>${esc(quest.title)}</strong>
          <span class="blurb">${esc(quest.description)}</span>
          <span class="quest-progress">${meter(progress / quest.target)}<b>${progress}/${quest.target}</b></span>
          <span class="rewards">${rewardChips(quest.reward)}</span>
        </div>
        <div class="card-buy">${complete
          ? `<button type="button" class="btn btn-gold claim" data-action="claim-quest" data-quest="${id}">Claim!</button>`
          : '<span class="lock">In progress</span>'}</div>
      </li>`;
    }).join('');
    return `${ids.length ? `<ul class="cards">${cards}</ul>` : `<div class="empty">${icon('sparkle', 'empty-icon')}<strong>Every quest complete!</strong><p>You are a true garden keeper.</p></div>`}
      <p class="hint">${done} of ${QUESTS.length} quests completed. New quests appear when you claim rewards.</p>`;
  },
};
