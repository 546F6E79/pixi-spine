import {Updatable} from "./Updatable";
import {TransformConstraintData} from "./TransformConstraintData";
import {Bone} from "./Bone";
import {Vector2, MathUtils} from "./Utils";
import {Skeleton} from "./Skeleton";
/******************************************************************************
 * Spine Runtimes Software License
 * Version 2.5
 *
 * Copyright (c) 2013-2016, Esoteric Software
 * All rights reserved.
 *
 * You are granted a perpetual, non-exclusive, non-sublicensable, and
 * non-transferable license to use, install, execute, and perform the Spine
 * Runtimes software and derivative works solely for personal or internal
 * use. Without the written permission of Esoteric Software (see Section 2 of
 * the Spine Software License Agreement), you may not (a) modify, translate,
 * adapt, or develop new applications using the Spine Runtimes or otherwise
 * create derivative works or improvements of the Spine Runtimes or (b) remove,
 * delete, alter, or obscure any trademarks or any copyright, trademark, patent,
 * or other intellectual property or proprietary rights notices on or in the
 * Software, including any copy thereof. Redistributions in binary or source
 * form must include this license and terms.
 *
 * THIS SOFTWARE IS PROVIDED BY ESOTERIC SOFTWARE "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
 * EVENT SHALL ESOTERIC SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, BUSINESS INTERRUPTION, OR LOSS OF
 * USE, DATA, OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

export class TransformConstraint implements Updatable {
    data: TransformConstraintData;
    bones: Array<Bone>;
    target: Bone;
    rotateMix = 0; translateMix = 0; scaleMix = 0; shearMix = 0;
    temp = new Vector2();

    constructor (data: TransformConstraintData, skeleton: Skeleton) {
        if (data == null) throw new Error("data cannot be null.");
        if (skeleton == null) throw new Error("skeleton cannot be null.");
        this.data = data;
        this.rotateMix = data.rotateMix;
        this.translateMix = data.translateMix;
        this.scaleMix = data.scaleMix;
        this.shearMix = data.shearMix;
        this.bones = new Array<Bone>();
        for (let i = 0; i < data.bones.length; i++)
            this.bones.push(skeleton.findBone(data.bones[i].name));
        this.target = skeleton.findBone(data.target.name);
    }

    apply () {
        this.update();
    }

    update () {
        let rotateMix = this.rotateMix, translateMix = this.translateMix, scaleMix = this.scaleMix, shearMix = this.shearMix;
        let target = this.target;
        let tm = target.matrix;
        let ta = tm.a, tb = tm.c, tc = tm.b, td = tm.d;
        let bones = this.bones;
        for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            let m = bone.matrix;

            if (rotateMix > 0) {
                let a = m.a, b = m.c, c = m.b, d = m.d;
                let r = Math.atan2(tc, ta) - Math.atan2(c, a) + this.data.offsetRotation * MathUtils.degRad;
                if (r > MathUtils.PI)
                    r -= MathUtils.PI2;
                else if (r < -MathUtils.PI)
                    r += MathUtils.PI2;
                r *= rotateMix;
                let cos = Math.cos(r), sin = Math.sin(r);
                m.a = cos * a - sin * c;
                m.c = cos * b - sin * d;
                m.b = sin * a + cos * c;
                m.d = sin * b + cos * d;
            }

            if (translateMix > 0) {
                let temp = this.temp;
                target.localToWorld(temp.set(this.data.offsetX, this.data.offsetY));
                m.tx += (temp.x - bone.worldX) * translateMix;
                m.ty += (temp.y - bone.worldY) * translateMix;
            }

            if (scaleMix > 0) {
                let bs = Math.sqrt(m.a * m.a + m.b * m.b);
                let ts = Math.sqrt(ta * ta + tc * tc);
                let s = bs > 0.00001 ? (bs + (ts - bs + this.data.offsetScaleX) * scaleMix) / bs : 0;
                m.a *= s;
                m.b *= s;
                bs = Math.sqrt(m.c * m.c + m.d * m.d);
                ts = Math.sqrt(tb * tb + td * td);
                s = bs > 0.00001 ? (bs + (ts - bs + this.data.offsetScaleY) * scaleMix) / bs : 0;
                m.c *= s;
                m.d *= s;
            }

            if (shearMix > 0) {
                let b = m.c, d = m.d;
                let by = Math.atan2(d, b);
                let r = Math.atan2(td, tb) - Math.atan2(tc, ta) - (by - Math.atan2(m.b, m.a));
                if (r > MathUtils.PI)
                    r -= MathUtils.PI2;
                else if (r < -MathUtils.PI)
                    r += MathUtils.PI2;
                r = by + (r + this.data.offsetShearY * MathUtils.degRad) * shearMix;
                let s = Math.sqrt(b * b + d * d);
                m.c = Math.cos(r) * s;
                m.d = Math.sin(r) * s;
            }
        }
    }
}
