(() => {
	"use strict";

	// Graphs
	const ctx = document.getElementById("myChart");
	// eslint-disable-next-line no-unused-vars
	const myChart = new Chart(ctx, {
		type: "line",
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
					data: [
						984874.4, 932615.3, 1191542.7, 932291.5, 1194252.1, 1114543.6,
						1254592.8, 1204459.1, 1099238.6, 1079290.3, 1164020.6, 629683.2,
					],
					lineTension: 0,
					backgroundColor: "transparent",
					borderColor: "#028C44",
					borderWidth: 4,
					pointBackgroundColor: "028C44",
					label: "2023",
				},
				{
					data: [
						968872.6, 1130021.6, 816632.0, 618007.5, 606818.7, 861412.6,
						620495.1, 635648.9, 576067.0, 1310736.3, 1193778.3, 614303.3,
						690519.5,
					],

					lineTension: 0,
					backgroundColor: "transparent",
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
						text: "Sum of CO2 emission [kg]",
					},
				},
			},
		},
	});
})();
