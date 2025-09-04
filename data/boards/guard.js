const { boardConnect } = require('protonode')
const { Protofy } = require('protobase')

const run = Protofy("code", async ({ context, states, board }) => {
board.onChange({
  name: "guard button1",
  changed: async (value) => {
    if (value === "OFF") {
      await board.execute_action({
        name: "create states",
        params: {
          id: Date.now().toString(),
          status: "green",
          timestamp: new Date().toISOString(),
        },
      });
    }
  },
});

board.onChange({
  name: "guard button2",
  changed: async (value) => {
    if (value === "OFF") {
      await board.execute_action({
        name: "create states",
        params: {
          status: "red",
          timestamp: new Date().toISOString(),
        },
      });
    }
  },
});

board.onChange({
  name: "lastCreated states",
  changed: async (value) => {
    if (value.status === "green")
      await board.execute_action({ name: "guard leds green", params: {} });
    if (value.status === "red")
      await board.execute_action({ name: "guard leds red", params: {} });
  },
});

})

boardConnect(run)