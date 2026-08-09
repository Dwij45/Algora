export const QUESTION_BY_SLUG = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    title
    titleSlug
    content
    difficulty
    sampleTestCase
    exampleTestcases
    hints
    topicTags {
      name
      slug
    }
    stats
    similarQuestions
    metaData
  }
}
`;

/** Current LeetCode schema exposes questionList (not problemsetQuestionList). */
export const PROBLEMSET_SEARCH = `
query problemsetQuestionList(
  $categorySlug: String
  $limit: Int
  $skip: Int
  $filters: QuestionListFilterInput
) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      questionFrontendId
      title
      titleSlug
      difficulty
      acRate
      topicTags {
        name
        slug
      }
    }
  }
}
`;
