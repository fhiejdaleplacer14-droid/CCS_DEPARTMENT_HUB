import Badge from './ui/Badge';
import Card, { CardHeader } from './ui/Card';
import { IconSparkle } from './icons';
import { dateTime, percent } from '../lib/format';

const QUALITY_TONES = {
    excellent: 'success',
    good: 'success',
    fair: 'warning',
    poor: 'danger',
};

export default function AiAnalysisPanel({ ai, status }) {
    const screened = Boolean(ai.decision);

    return (
        <Card>
            <CardHeader
                title="AI Screening Result"
                description="A recommendation only. The department makes the final decision."
            />

            <div className="p-5">
                <div className="flex items-start gap-3">
                    <IconSparkle className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" />
                    <p className="prose-measure text-sm leading-relaxed text-slate-600">{ai.reason}</p>
                </div>

                {screened && (
                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-4">
                        <Item label="Reviewer" value={status === 'REJECTED' ? 'No' : 'Yes'} />
                        <Item label="Confidence" value={percent(ai.confidence)} />
                        <Item
                            label="Quality"
                            value={
                                ai.quality ? (
                                    <Badge tone={QUALITY_TONES[ai.quality] ?? 'neutral'} className="capitalize">
                                        {ai.quality}
                                    </Badge>
                                ) : (
                                    '--'
                                )
                            }
                        />
                        <Item label="Detected subject" value={ai.subject ?? '--'} />
                    </dl>
                )}

                {ai.analyzed_at && (
                    <p className="mt-4 text-xs text-slate-400">Screened {dateTime(ai.analyzed_at)}</p>
                )}
            </div>
        </Card>
    );
}

function Item({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 font-medium text-slate-900">{value}</dd>
        </div>
    );
}
