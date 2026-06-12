export default defineComponent({
  async run({ steps, $ }) {
    
    const results = {
      title: "",
      transcript: "",
      summary: "",
      additional_info: ""
    }

    // Add line breaks to the transcript
    const originalTranscript = steps.create_transcription.$return_value.transcription

    function splitStringIntoSentences(str) {
        
      // If the provide string is null, return an array with an error message.
      if (!str) {
        const noTranscript = ["Null argument"]
        return noTranscript
      }

      /* Check to see if the transcript contains sentence-ending punctuation. If not,
       * add a period to the end of the transcript.
       */
      if (str.match(/(?:^|[^.!?]+)[.!?]+\s?/g) == null) {
        str += str + "."
      }
      
      // Split the transcript into an array of individual sentences
      const sentences = str.match(/(?:^|[^.!?]+)[.!?]+\s?/g) || [] // split into sentences
      
      // Initialize the array into which we'll store our paragraphs
      const result = []

      if (sentences.length > 1) {
        /* If the sentences array contains more than one element, loop through it
         * and join sentences together in groups of three. Push each group to the
         * results array.
         */
        for (let i = 0; i < sentences.length; i += 3) {
          result.push(sentences.slice(i, i + 3).join(' '))
        } 
      } else {
        /* If the sentences array only contains one element (which will happen if the 
         * transcript did not contain sentence-ending punctuation), we will instead
         * split the transcript into groups of no more than 800 characters. If 
         * 800 characters happens to be in the middle of a word, we go to the end
         * of that word, and also add on the whitespace character after it.
         */
        const maxLength = 800;
        const words = sentences[0].split(' ');
        let currentLine = '';
      
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const lengthWithWord = currentLine.length + word.length;
      
          if (lengthWithWord <= maxLength) {
            currentLine += (currentLine.length === 0 ? '' : ' ') + word;
          } else {
            result.push(currentLine);
            currentLine = word;
          }
        }
      
        if (currentLine.length > 0) {
          result.push(currentLine);
        }
      }

      return result
    }

    function joinArrayWithBlankLine(arr) {
      return arr.join('\n\n')
    }


    const transcriptArray = splitStringIntoSentences(originalTranscript)

    results.transcript = joinArrayWithBlankLine(transcriptArray)

    // Extract the summary
    const summary = steps.chat.$return_value.choices[0].message.content

    function splitSummary(str) {
      const titleDelimiter = /^.*\n\n/
      const summaryDelimiter = /\n\s*?--Summary--\s*?\n\s*/
      const additionalInfoDelimiter = /\n\s*?--Additional Info--\s*?\n\s*/;

      const titleMatch = str.match(titleDelimiter)
      const summaryMatch = str.match(summaryDelimiter)
      const additionalInfoMatch = str.match(additionalInfoDelimiter)

      if (!titleMatch || !summaryMatch || !additionalInfoMatch) {
        console.log("One or more delimiters not found")
        return str
      } else {
        const titleIndex = titleMatch.index
        const summaryIndex = summaryMatch.index
        const additionalInfoIndex = additionalInfoMatch.index

        results.title = str.slice(0, titleIndex + titleMatch[0].length).trim().replace(/^#\s*/,"")
        results.summary = str.slice(summaryIndex + summaryMatch[0].length, additionalInfoIndex).trim()
        results.additional_info = str.slice(additionalInfoIndex + additionalInfoMatch[0].length).trim()
      }
    }

    splitSummary(summary)

    // Return the results object
    return results

  },
})