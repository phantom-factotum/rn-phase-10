# React Native Phase 10
A recreation of the Phase 10 game using react native and expo

## TODO
 - test bot functionality more
 - bot should discard a card that the nextPlayer can use to hit only when the remaining cards
   are undiscardable


## Weirdness/Bugs
 - I could not find a decent zip file of phase 10 cards images so the cards are actually Views/Text instead of image components
 - Sometimes when attempting to hit run from the start `canHit` will expect the wrong value. Haven't been able to reproduce it
 - Sometimes items can be double dropped (happened in simulator when I sneezed and accidentally double clicked while    dragging so may be a emulator only thing). Resulted in a card being placed in phase objective area twice and since card's ids are used with the  `key` prop a warning appears
 - When 3 or more players are playing all of the screen's height will be used and the ScrollView component will either fail to scroll, or will scroll and then ruin the drag and drop component's functionality
    * an activationDelay of 120 on the DndProvider seems to fix this