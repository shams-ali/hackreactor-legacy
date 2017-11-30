
class Node {
  constructor(command = '', next = null, prev = null) {
    this.command = command;
    this.next = next;
    this.prev = prev;
  }
}

// A type of circularly linked list that keeps track of the user's previously used commands
const commandHistory = class CommandHistory {
  constructor() {
    // The initial 'command' is an empty line
    //   This is to simulate the initial state of the terminal input
    this.head = new Node();

    // initialize the next/prev pointers
    this.head.next = this.head;
    this.head.prev = this.head;

    this.tail = this.head;

    // the current command that the user is on
    this.current = this.head;
  }

  addCommand(command) {
    if (this.contains(command)) {

      // TODO: refactor this if statement body to delete the current instance of the command
      // then let the rest of the function execute, so the command will be at the most recent position

      return undefined; // don't add a command that's already added
    }

    // make a new node for the new command
    const newCommand = new Node(command, this.head, this.tail);

    // update the head + tail pointers
    this.tail.next = newCommand;
    this.tail = this.tail.next;
    this.head.prev = this.tail;

    // reset the current command
    this.current = this.head;
  }

  contains(target) {
    let index = this.head;

    do { // do while, instead of while, in case if there is only 1 item in the list
      if (index.command === target) {
        return true;
      }
      index = index.next;
    } while (index !== this.head);

    return false;
  }

  getPrevCommand() {
    this.current = this.current.prev;
    return this.getCurrentCommand();
  }

  getNextCommand() {
    this.current = this.current.next;
    return this.getCurrentCommand();
  }

  getCurrentCommand() {
    return this.current.command;
  }
};

module.exports = { commandHistory };

