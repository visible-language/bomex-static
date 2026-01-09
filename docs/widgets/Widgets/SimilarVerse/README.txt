This contains a similar verse finder for the Standard Works.

All of the verses from the standard works have been made into sentence embeddings (https://en.wikipedia.org/wiki/Sentence_embedding) using MPnet (https://huggingface.co/sentence-transformers/all-mpnet-base-v2), a Language Model from Microsoft. 

That turns each verse into a high-dimensional vector. 

We use sklearn to find nearest neighbors in high-dimensional space, then put these into a giant lookup table with each verse having its nearest neighbors on demand.

This means the site needs a minute to load the huge table on page load.
We might figure out a better system later.

