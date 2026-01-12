(() => {
	"use strict";

	// Graphs
	const ctx = document.getElementById("myChart");
	// eslint-disable-next-line no-unused-vars
	const myChart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: [
				"January",
				"Febuary",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December",
			],
			datasets: [
				{
					data: [6, 7, 3, 4, 4, 5, 6, 7, 5, 5, 0, 1],
					lineTension: 0,
					backgroundColor: "",
					borderColor: "#028C44",
					borderWidth: 4,
					pointBackgroundColor: "#028C44",
					label: "2023",
				},
				{
					data: [1, 5, 3, 1, 0, 3, 1, 3, 3, 4, 5, 2],
					lineTension: 0,
					backgroundColor: "",
					borderColor: "#171ad1",
					borderWidth: 4,
					pointBackgroundColor: "#171ad1",
					label: "2024",
				},
			],
		},
		options: {
			plugins: {
				legend: {
					display: true,
				},
				tooltip: {
					boxPadding: 3,
				},
			},
			scales: {
				x: {
					title: {
						display: true,
						text: "Month",
					},
				},
				y: {
					title: {
						display: true,
						text: "Accidents per a month",
					},
				},
			},
		},
	});
})();
