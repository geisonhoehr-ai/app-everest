CREATE OR REPLACE FUNCTION get_question_performance_for_quiz(p_quiz_id UUID)
RETURNS TABLE(
    question_id UUID,
    question_text TEXT,
    correct_answers BIGINT,
    incorrect_answers BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        qq.id AS question_id,
        qq.question_text,
        COUNT(CASE WHEN qaa.is_correct THEN 1 END) AS correct_answers,
        COUNT(CASE WHEN NOT qaa.is_correct THEN 1 END) AS incorrect_answers
    FROM
        public.quiz_questions AS qq
    LEFT JOIN
        public.quiz_attempt_answers AS qaa ON qq.id = qaa.quiz_question_id
    WHERE
        qq.quiz_id = p_quiz_id
    GROUP BY
        qq.id, qq.question_text
    ORDER BY
        qq.created_at;
END;
$$;
