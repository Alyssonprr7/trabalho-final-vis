import { loadChartScatter, loadChartBubble, loadChartBar, clearChart } from './plot';
import { Games } from "./games";
import { getPopularity } from './services/popularityService';
import { getLongevity } from './services/longevityService';

const hideButtons = async (selectedQuestion) => {
    const buttonContainerQuestion1 = document.querySelector('.question-1-button-container');
    const buttonContainerQuestion2 = document.querySelector('.question-2-button-container');
    const buttonContainerQuestion3 = document.querySelector('.question-3-button-container');

    if (selectedQuestion === '1') {
        buttonContainerQuestion2.style.display = 'none';
        buttonContainerQuestion3.style.display = 'none';
        buttonContainerQuestion1.style.display = 'flex';

    } else if (selectedQuestion === '2') {
        buttonContainerQuestion1.style.display = 'none';
        buttonContainerQuestion3.style.display = 'none';
        buttonContainerQuestion2.style.display = 'flex';
    } else if (selectedQuestion === '3') {
        buttonContainerQuestion1.style.display = 'none';
        buttonContainerQuestion2.style.display = 'none';
        buttonContainerQuestion3.style.display = 'flex';
    }
}

const selectListener = () => {
    const select = document.getElementById('question-select');
    if (!select) {
        return;
    }

    hideButtons(select.value);
    select.addEventListener('change', () => {
        clearChart();
        hideButtons(select.value);
    });
}

window.onload = async () => {
    selectListener();
    const games = new Games();
    
    await games.init();
    await games.loadGames();

    await getPopularity(games);
    await getLongevity(games)
};