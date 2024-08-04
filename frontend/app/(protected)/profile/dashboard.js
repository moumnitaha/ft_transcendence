import React from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "chart.js/auto";
import moment from "moment";

const PlayerDashboard = ({ data, username }) => {
  const barChartData = {
    labels: data.map((game) =>
      moment(game.finished_at).format("MMM DD, YYYY HH:mm")
    ),
    datasets: [
      {
        label: `${username}'s Score`,
        data: data.map((game) =>
          game.player1 === username ? game.score1 : game.score2
        ),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        borderRadius: 5,
      },
      {
        label: "Opponent's Score",
        data: data.map((game) =>
          game.player1 === username ? -game.score2 : -game.score1
        ),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "white",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const game = data[context.dataIndex];
            const opponent =
              game.player1 === username ? game.player2 : game.player1;
            const score = context.dataset.data[context.dataIndex];
            const isUserDataset = context.dataset.label.includes(username);
            const displayName = isUserDataset ? username : opponent;
            const opponentName = isUserDataset ? opponent : username;
            return `${displayName}: ${Math.abs(score)} (vs ${opponentName})`;
          },
        },
      },
      title: {
        display: true,
        text: "Game Scores by Timestamp",
        color: "white",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMin: -5,
        suggestedMax: 5,
        ticks: {
          color: "white",
        },
      },
      x: {
        ticks: {
          color: "white",
        },
      },
    },
  };

  const totalGames = data.length;
  const wins = data.filter((game) => game.winner === username).length;
  const losses = totalGames - wins;
  const scores = data.map((game) =>
    game.player1 === username ? game.score1 : game.score2
  );
  const averageScore =
    scores.reduce((acc, score) => acc + score, 0) / totalGames;

  const doughnutChartData = {
    labels: ["Wins", "Losses", "Average Score"],
    datasets: [
      {
        data: [wins, losses, averageScore],
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "white",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const label = context.label;
            return `${label}: ${value}`;
          },
        },
      },
      title: {
        display: true,
        text: "Player Statistics",
        color: "white",
      },
    },
  };

  const lineChartData = {
    labels: data.map((game) =>
      moment(game.finished_at).format("MMM DD, YYYY HH:mm")
    ),
    datasets: [
      {
        label: `${username}'s Score Progression`,
        data: scores,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "white",
        },
      },
      title: {
        display: true,
        text: "Score Progression Over Time",
        color: "white",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "white",
        },
      },
      x: {
        ticks: {
          color: "white",
        },
      },
    },
  };

  return (
    <div className="w-[75%] bg-zinc-800 p-4 rounded-md">
      <h1 className="text-center m-4 text-2xl font-bold text-white text-shadow-neon">
        Player Dashboard
      </h1>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "20px",
        }}
      >
        <div style={{ width: "45%", height: "400px" }}>
          <Bar data={barChartData} options={barChartOptions} />
        </div>
        <div style={{ width: "45%", height: "400px" }}>
          <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
        </div>
      </div>
      <div style={{ width: "90%", height: "400px", margin: "0 auto" }}>
        <Line data={lineChartData} options={lineChartOptions} />
      </div>
    </div>
  );
};

export default PlayerDashboard;
