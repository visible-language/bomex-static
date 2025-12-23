This contains 'semantic maps' of both the bible and the book of mormon.

Each dot represents a verse. 
All of the verses have been made into sentence embeddings(https://en.wikipedia.org/wiki/Sentence_embedding) using MPnet (https://huggingface.co/sentence-transformers/all-mpnet-base-v2), a Language Model from Microsoft. 

That turns each verse into a high-dimensional vector. 

We use Dimenstionality Reduction (Specifically UMAP) to put this extremely high-dimensional data into 2-d and map it onto the screen.

I wrote the map using HTML Canvas and d3js.

The legend is a work in progress, just slapped on for now.

The search bar uses an autocomplete feature I found on someone's github and edited. TODO:Get version of that in VisLang repo
Data is stored in one huge .js file. That might want to be changed.

Verses are (usually) grouped by semantic content. That means that verses that talk about similar things are usually close together. This is true on a local level (two close dots usually talk about the same thing) but not necessarily true on a global level (two dots that are moderately far apart are not more similar than two dots that are very far apart)

TODO: We need a nice legend for this, and don't have one yet. 