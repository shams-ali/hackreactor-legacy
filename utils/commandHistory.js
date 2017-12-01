
// A helper class, for CommandHistory
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
    if (command.length < 1) {
      return false; // safeguard against an empty string command being added
    }

    // TODO: 1. Try to hack the command with literal characters, Ex. \r (return carraige)
    //       2. Add pointless / non-printable commands to a 'blacklist' ( \r is an example of both)
    //            all spaces is an example of a pointless command
    //       3. Stop blacklisted commands from being added

    const commandRemoved = this.remove(command);

    if ((commandRemoved === true) || (commandRemoved === null)) {
      // make a new node for the new command
      const newCommand = new Node(command, this.head, this.tail);

      // update the head + tail pointers
      this.tail.next = newCommand;
      this.tail = this.tail.next;
      this.head.prev = this.tail;

      // reset the current command
      this.current = this.head;
    } else if (commandRemoved === false) {
      // It is already at the end, so don't add it to the end
    }
  }

  // Returns true if the target was removed
  // Returns null if the target was not found
  // Returns false if the target was not removed
  remove(target) {
    // NOTE: Remember that this.head.command is always an empty line, to simulate the default of empty terminal input
    if (this.head.next === this.head) { // if there is only 1 element in this list
      // don't bother removing if no command was ever added
      return null;
    }

    let index = this.head.next;

    while (index !== this.head) { // go through the rest of the list
      if (index.command === target) { // if the index node has the target command
        if (this.tail === index) { // check if it's the tail element
          return false; // it's already at the end, so don't remove or add the command
        }

        // remove the item from the list
        index.prev.next = index.next;
        index.next.prev = index.prev;
        return true; // indicate that the item was removed
      }

      index = index.next; // check the next item in the list
    }

    return null; // indicate that the item was not found
  } // end of remove(target)

  getRecentCommand() { // Newest -> Most Recent Commands
    this.current = this.current.prev;
    return this.getCurrentCommand();
  }

  getOldCommand() { // Oldest commands
    this.current = this.current.next;
    return this.getCurrentCommand();
  }

  getCurrentCommand() {
    return this.current.command;
  }
}; // end of class CommandHistory

module.exports = { commandHistory };

