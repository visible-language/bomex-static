var speakers = [
	"Abinadi",
	"Alma2",
	"Alma",
	"Amaleki",
	"Ammon",
	"Amulek",
	"Angels",
	"AntiNephiLehi",
	"Benjamin",
	"BrothersNephi",
	"CaptainMoroni",
	"Christ",
	"Enos",
	"FatherLamoni",
	"Godhead",
	"Helaman",
	"Isaiah",
	"Jacob",
	"Jarom",
	"Joseph",
	"Korihor",
	"Lamoni",
	"Lehi",
	"Limhi",
	"Malachi",
	"Mormon",
	"Moroni",
	"Mosiah",
	"Nephi2",
	"Nephi",
	"Pahoran",
	"SamuelLamanite",
	"Zeniff",
	"Zenos",
	];

var checkboxes = `
<label class="container">Abinadi
<input type="checkbox" id="Abinadi" onclick="check(speakers)">
<span class="checkmark Abinadi"></span>
</label> 
<label class="container">Alma the Younger
<input type="checkbox" id="Alma2" onclick="check(speakers)">
<span class="checkmark Alma2"></span>
</label> 
<label class="container">Alma
<input type="checkbox" id="Alma" onclick="check(speakers)">
<span class="checkmark Alma"></span>
</label> 
<label class="container">Amaleki
<input type="checkbox" id="Amaleki" onclick="check(speakers)">
<span class="checkmark Amaleki"></span>
</label> 
<label class="container">Ammon
<input type="checkbox" id="Ammon" onclick="check(speakers)">
<span class="checkmark Ammon"></span>
</label> 
<label class="container">Amulek
<input type="checkbox" id="Amulek" onclick="check(speakers)">
<span class="checkmark Amulek"></span>
</label> 
<label class="container">Angels
<input type="checkbox" id="Angels" onclick="check(speakers)">
<span class="checkmark Angels"></span>
</label> 
<label class="container">Anti-Nephi-Lehi
<input type="checkbox" id="AntiNephiLehi" onclick="check(speakers)">
<span class="checkmark AntiNephiLehi"></span>
</label> 
<label class="container">Benjamin
<input type="checkbox" id="Benjamin" onclick="check(speakers)">
<span class="checkmark Benjamin"></span>
</label> 
<label class="container">Brothers of Nephi
<input type="checkbox" id="BrothersNephi" onclick="check(speakers)">
<span class="checkmark BrothersNephi"></span>
</label> 
<label class="container">Captain Moroni
<input type="checkbox" id="CaptainMoroni" onclick="check(speakers)">
<span class="checkmark CaptainMoroni"></span>
</label> 
<label class="container">Christ
<input type="checkbox" id="Christ" onclick="check(speakers)">
<span class="checkmark Christ"></span>
</label> 
<label class="container">Enos
<input type="checkbox" id="Enos" onclick="check(speakers)">
<span class="checkmark Enos"></span>
</label> 
<label class="container">Father of Lamoni
<input type="checkbox" id="FatherLamoni" onclick="check(speakers)">
<span class="checkmark FatherLamoni"></span>
</label> 
<label class="container">Godhead
<input type="checkbox" id="Godhead" onclick="check(speakers)">
<span class="checkmark Godhead"></span>
</label> 
<label class="container">Helaman
<input type="checkbox" id="Helaman" onclick="check(speakers)">
<span class="checkmark Helaman"></span>
</label> 
<label class="container">Isaiah
<input type="checkbox" id="Isaiah" onclick="check(speakers)">
<span class="checkmark Isaiah"></span>
</label> 
<label class="container">Jacob
<input type="checkbox" id="Jacob" onclick="check(speakers)">
<span class="checkmark Jacob"></span>
</label> 
<label class="container">Jarom
<input type="checkbox" id="Jarom" onclick="check(speakers)">
<span class="checkmark Jarom"></span>
</label> 
<label class="container">Joseph Sold into Egypt
<input type="checkbox" id="Joseph" onclick="check(speakers)">
<span class="checkmark Joseph"></span>
</label> 
<label class="container">Korihor
<input type="checkbox" id="Korihor" onclick="check(speakers)">
<span class="checkmark Korihor"></span>
</label> 
<label class="container">Lamoni
<input type="checkbox" id="Lamoni" onclick="check(speakers)">
<span class="checkmark Lamoni"></span>
</label> 
<label class="container">Lehi
<input type="checkbox" id="Lehi" onclick="check(speakers)">
<span class="checkmark Lehi"></span>
</label> 
<label class="container">Limhi
<input type="checkbox" id="Limhi" onclick="check(speakers)">
<span class="checkmark Limhi"></span>
</label> 
<label class="container">Malachi
<input type="checkbox" id="Malachi" onclick="check(speakers)">
<span class="checkmark Malachi"></span>
</label> 
<label class="container">Mormon
<input type="checkbox" id="Mormon" onclick="check(speakers)">
<span class="checkmark Mormon"></span>
</label> 
<label class="container">Moroni
<input type="checkbox" id="Moroni" onclick="check(speakers)">
<span class="checkmark Moroni"></span>
</label> 
<label class="container">Mosiah
<input type="checkbox" id="Mosiah" onclick="check(speakers)">
<span class="checkmark Mosiah"></span>
</label> 
<label class="container">Nephi Son of Helaman
<input type="checkbox" id="Nephi2" onclick="check(speakers)">
<span class="checkmark Nephi2"></span>
</label> 
<label class="container">Nephi
<input type="checkbox" id="Nephi" onclick="check(speakers)">
<span class="checkmark Nephi"></span>
</label> 
<label class="container">Pahoran
<input type="checkbox" id="Pahoran" onclick="check(speakers)">
<span class="checkmark Pahoran"></span>
</label> 
<label class="container">Samuel the Lamanite
<input type="checkbox" id="SamuelLamanite" onclick="check(speakers)">
<span class="checkmark SamuelLamanite"></span>
</label> 
<label class="container">Zeniff
<input type="checkbox" id="Zeniff" onclick="check(speakers)">
<span class="checkmark Zeniff"></span>
</label> 
<label class="container">Zenos
<input type="checkbox" id="Zenos" onclick="check(speakers)">
<span class="checkmark Zenos"></span>
</label> 
`;
fullInstructions = `
<h3>Navigation</h3>
<br>Click and drag to rotate the network, or use the mouse wheel to zoom. 
<br>
<br>Click a node to highlight its connections, or click the background without dragging to return the graph to normal.
<br>
<br>Use the dropdown menu in the bottom-right corner to specify a speaker, then click to highlight all of that speaker's nodes.
<br>
<br>Check or uncheck legend items in the legend tab to toggle their display.
<br>
<br>Connections can be turned on or off using the button at the bottom of the screen.
`;
mobileInstructions = `
<h3>Navigation</h3>
<br>Drag to rotate the network, or pinch to zoom. Drag with two fingers to pan.
<br>
<br>Tap any node to highlight its connections, or tap the background without dragging to return the graph to normal.
<br>
<br>Use the buttons in the bottom-right corner to specify a node, then click go and the selected node will appear in the center of the screen.
<br>
<br>Check or uncheck legend items in the legend tab to toggle their display.
<br>
<br>Connections can be turned on or off using the button at the bottom of the screen.
`  ;
myDict = {"AbinadiParagraph": "Abinadi was a prophet who was killed by King Noah after calling his people to repentance. Although Abinadi saw no success from his preaching in his lifetime, Alma, one of King Noah's priests, was converted and became a force for good.",
"Alma2Paragraph": "Alma the Younger grew up with the sons of Mosiah. As a young man, he went about seeking to destroy the Church. As a result of the prayers of his father and others, Alma was visited by an angel and converted. Alma the Younger served as chief judge of the land and high priest over the Church.",
"AlmaParagraph": "Alma was one of the wicked priests of king Noah. After hearing Abinadi speak, Alma's heart was changed and he was cast out by the king. He set about preaching Abinadi's words in private and baptized many at the waters of Mormon. He and his people eventually travelled to the land of Zarahemla, joining the people there. Alma served as high priest of the Church while Mosiah was king.",
"AmalekiParagraph": "Amaleki was a descendant of Lehi who kept the record of his people. He wrote only 18 verses, which are found in the Book of Omni. He was the last person to write in the small plates of Nephi before passing the record  to King Benjamin.",
"AmmonParagraph": "Ammon was one of the sons of King Mosiah. He was so dedicated to preaching the gospel that he rejected his right to be king in order to lead a fourteen-year mission to the Lamanites. He served the Lamanite king Lamoni, and in one of the most memorable stories from the Book of Mormon, defended the king's sheep from bandits.",
"AmulekParagraph": "Amulek was a rich and popular Nephite living in the city of Ammonihah when an angel commanded him in a vision to receive Alma the Younger into his home. Alma helped Amulek grow strong in the faith, and they served together as missionary companions. Although their mission was full of hardship, miracles followed them, and they were ultimately successful.",
"AngelsParagraph": "Angels are celestial visitors that appear in the Book of Mormon to give counsel, and to guide prophets through visions.",
"AntiNephiLehiParagraph": "The people of Anti-Nephi-Lehi were Lamanites who converted to the Lord. As part of their conversion, they buried their weapons as a symbol of their covenant to shed no more blood. Two thousand of their young men, who had not made the covenant, were led by Helaman to miraculous victories.",
"BrothersNephiParagraph": "Laman and Lemuel were two of Lehi's sons, and Nephi's older brothers. They had a difficult time dealing with the hardships associated with leaving their home and traveling in the wilderness for many years. They often antagonized their brothers and father, and upon arrival in the Americas, they and their descendants (later called Lamanites) split from the rest of the family (later called Nephites.)",
"BenjaminParagraph": "Benjamin was a righteous king of the Nephites and father to Mosiah. Near the end of his life, Benjamin erected a tower at the temple and called all his people to hear him speak. In this famous discourse, he taught of the plan of salvation and other fundamental doctrines.",
"ChristParagraph": "After being crucified and resurrected in Jerusalem, Jesus Christ appeared to the people in the Americas. His teachings are recorded in the Book of Mormon.",
"EnosParagraph": "Enos was the son of Jacob. In his book, he tells of an incident in which he went to hunt in the woods and prayed all day and night for forgiveness of his sins, for his people, and for his enemies. Enos covenanted with the Lord regarding the preservation of the scriptures. He preached to the Lamanites, with little success.",
"GodheadParagraph": "The Godhead is comprised of God the Father, Jesus Christ, and the Holy Ghost. They spoke to prophets in the Book of Mormon.",
"HelamanParagraph": "Helaman, son of Alma the Younger, was a missionary and later military commander. He preached to the Anti-Nephi-Lehies, and led 2,000 of them (sometimes referred to as the stripling warriors) in several Nephite military campaigns.",
"IsaiahParagraph": "Isaiah was an Old Testament prophet extensively quoted in the Book of Mormon. Lehi's family brought scriptures with them from the old world, and the words of Isaiah were among them.",
"JacobParagraph": "Jacob was Nephi's younger brother. He was significantly younger than Nephi, being born around the time of Nephi's marriage. Jacob was consecrated as a priest and became the leader of the Nephites after Nephi's death.",
"JaromParagraph": "Jarom was Enos's son and Lehi's great-grandson. He wrote the short (15-verse) book of Jarom, before handing the plates to his son, Omni. Jarom was a prophet who had visions and communicated with God.",
"JosephParagraph": "Joseph was one of the children of Jacob (Israel) in the Old Testament. His story of being sold into slavery and rising to prominence in Egypt is told in Genesis 37-45. He is quoted in the Book of Mormon as the namesake of Joseph, Lehi's youngest son.",
"KorihorParagraph": "Korihor was an anti-Christ who contended with Alma. After being struck mute by God, Korihor recognized the error of his ways, but was cast out. He was eventually trampled to death while begging among the Zoramites.",
"FatherLamoniParagraph": "Lamoni's father was high king over all the Lamanites. After seeing his son's conversion and the bond between his son, Lamoni, and Ammon, he became converted to the Lord. Lamoni's father then enacted laws to provide religious freedom in all the lands of the Lamanites.",
"LamoniParagraph": "Lamoni was a Lamanite king. Ammon came to preach and live among his people. Lamoni was impressed with Ammon's devotion, and was converted to the Lord. Lamoni and Ammon eventually preached to Lamoni's father, who was king over all the land and converted him to the gospel.",
"LehiParagraph": "Lehi was a prophet who lived at Jerusalem roughly the same time as Jeremiah. Having been warned in a vision that Jerusalem would be destroyed, he took his family, and some of his friends, and fled into the wilderness. After several years, his family built a boat and crossed the ocean to the American continent. Lehi's descendants comprise many of the people in the Book of Mormon.",
"LimhiParagraph": "Limhi, son of King Noah, was a righteous king. With the help of Ammon, Limhi and his people escaped from bondage to the Lamanites.",
"MalachiParagraph": "Malachi was an Old Testament prophet. His words were quoted by Jesus Christ during Christ's visit to the American continent.",
"MormonParagraph": "Mormon lived hundreds of years after the birth of Christ, when both the Nephites and Lamanites were largely wicked. He was a strong man who led the Nephite armies at the time of their impending destruction. Mormon collected and abridged the Book of Mormon, which is why it bears his name.",
"CaptainMoroniParagraph": "Captain Moroni was a righteous man who led the Nephite armies at a time when their nation was being attacked by the Lamanites. Although a bit impetuous, Moroni was able to quell rebellion among the Nephites, as well as successfully defend his land from the Lamanite invaders. He raised the title of liberty to rally his people.",
"MoroniParagraph": "Moroni was the son of Mormon. He abridged the record of the Brother of Jared and added it to his father's record. After being present for the final destruction of the Nephites, Moroni wandered in the wilderness for 20 years, hiding from the Lamanites. He eventually hid the record in the earth where it would later be found by Joseph Smith.",
"MosiahParagraph": "Mosiah was a righteous king and the son of Benjamin. Mosiah had the gift of seership, and was able to translate the record of the people of Jared through this gift. Mosiah and Alma the Elder worked closely together for the good of both the Nephites and Lamanites.",
"NephiBrethrenParagraph": "Laman and Lemuel were two of Lehi's sons, and Nephi's older brothers. They had a difficult time dealing with the hardships associated with leaving their home and traveling in the wilderness for many years. They often antagonized their brothers and father, and upon arrival in the Americas, they and their descendants (later named Lamanites) split from the rest of the family (later called Nephites.)",
"NephiParagraph": "Nephi was the son of Lehi and author of the first two books of the Book of Mormon. He was stalwart in his faith and devotion to the Lord, and became the first leader of the Nephites, named after him.",
"Nephi2Paragraph": "Nephi was the son of Helaman, and a Nephite prophet. He was named for Nephi, son of Lehi. Nephi served as chief judge, and later as a missionary. After passing the record to his son, also Nephi, he disappeared from the land shortly before the birth of Christ.",
"PahoranParagraph": "Pahoran was the chief judge (or governor) of the Nephites during a time of conflict and rebellion. Together with Captain Moroni, Pahoran helped unify his people and repel attacks from the Lamanites. Pahoran was a man of faith and devotion.",
"SamuelLamaniteParagraph": "Samuel was a Lamanite prophet who came among the Nephites and prophesied of the impending birth of Jesus Christ in Bethlehem. In his most famous episode, Samuel preached from the city wall. When angry people tried to hit him with stones and arrows, the Lord protected him and Samuel was able to deliver his full message.",
"ZeniffParagraph": "Zeniff was a Nephite who lived during the reign of King Benjamin. He led an expedition to settle in the land of Nephi, which was under Lamanite control. As king, Zeniff advocated for diplomacy over battle, and he and his people lived in uneasy peace with the Lamanites, punctuated by battle. Before his death, he conferred his kingdom on his son, Noah.",
"ZenosParagraph": "Zenos was an old-world prophet whose words were written on the plates of brass. His allegory of the olive tree is recorded in Jacob Chapter 5."
};
var speakerToDisplay = {
"Abinadi": "Abinadi",
"Alma2": "Alma the Younger",
"Alma": "Alma",
"Amaleki": "Amaleki",
"Ammon": "Ammon",
"Amulek": "Amulek",
"Angels": "Angels",
"AntiNephiLehi": "Anti-Nephi-Lehi",
"Benjamin": "Benjamin",
"BrothersNephi": "Brothers of Nephi",
"CaptainMoroni": "Captain Moroni",
"Christ": "Christ",
"Enos": "Enos",
"FatherLamoni": "Father of Lamoni",
"Godhead": "Godhead",
"Helaman": "Helaman",
"Isaiah": "Isaiah",
"Jacob": "Jacob",
"Jarom": "Jarom",
"Joseph": "Joseph Sold into Egypt",
"Korihor": "Korihor",
"Lamoni": "Lamoni",
"Lehi": "Lehi",
"Limhi": "Limhi",
"Malachi": "Malachi",
"Mormon": "Mormon",
"Moroni": "Moroni",
"Mosiah": "Mosiah",
"Nephi2": "Nephi Son of Helaman II",
"Nephi": "Nephi",
"Pahoran": "Pahoran",
"SamuelLamanite": "Samuel the Lamanite",
"Zeniff": "Zeniff",
"Zenos": "Zenos"};

var speakerToColor = {	
"Abinadi": "#9e9e9e",
"Alma2": "#8b4513",
"Alma": "#556b2f",
"Amaleki": "#9685f",
"Ammon": "#b22222 ",
"Amulek": "#008000",
"Angels": "#008b8b",
"AntiNephiLehi": "#3cb371",
"Benjamin": "#b8860b",
"BrothersNephi": "#40e0d0",
"CaptainMoroni": "#bdb76b",
"Christ": "#4682b4",
"Enos": "#67679c",
"FatherLamoni": "#00ff00",
"Godhead": "#87ceeb",
"Helaman": "#32cd32",
"Isaiah": "#8b008b",
"Jacob": "#ff4500",
"Jarom": "#ff8c00",
"Joseph": "#fffac8",
"Korihor": "#ffd700",
"Lamoni": "#9400d3",
"Lehi": "#00fa9a",
"Limhi": "#adff2f",
"Malachi": "#1e90ff",
"Mormon": "#0000ff",
"Moroni": "#da70d6",
"Mosiah": "#d8bfd8",
"Nephi2": "#ff00ff",
"Nephi": "#ffa07a",
"Pahoran": "#db7093",
"SamuelLamanite": "#ff1493",
"Zeniff": "#7b68ee",
"Zenos": "#ffdab9"};
