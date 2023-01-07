import Chart, { ChartItem } from 'chart.js/auto'

export function renderChart(element: any, keys: any, values: any, label: string) {

    new Chart(
        document.getElementById(element) as ChartItem,
        {
            type: 'line',
            data: {
                labels: keys,
                datasets: [
                    {
                        label: label,
                        data: values
                    }
                ]
            }
        }
    );
}