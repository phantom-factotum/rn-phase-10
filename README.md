# React Native Phase 10
A recreation of the Phase 10 game using react native and expo

## TODO
 - test bot functionality more


## Weirdness/Bugs
 - I could not find a decent zip file of phase 10 cards images so the cards are actually Views/Text instead of image components
 - Sometimes when attempting to hit run from the start `canHit` will expect the wrong value. Haven't been able to reproduce it
 - Sometimes items can be double dropped (happened in simulator when I sneezed and accidentally double clicked while    dragging so may be a emulator only thing). Resulted in a card being placed in phase objective area twice and since card's ids are used with the  `key` prop a warning appears
 - Code to end game hasnt been created yet; so after completing the 10th phase the game will attempt to access the 11th phase and crash
 - When 3 or more players are playing all of the screen's height will be used and the ScrollView component will either fail to scroll, or will scroll and then ruin the drag and drop component's functionality
